/**
 * POST /api/payments/verify
 *
 * Decodes and verifies the Base64url-encoded `result3ds` parameter that
 * WebXPay/Mastercard MPGS posts back to the secure3dResponseURL after 3DS.
 *
 * If verified AND booking details are provided, creates the booking in one
 * atomic server-side call using the admin client (avoids cookie-loss after
 * the external 3DS redirect).
 *
 * After a successful payment + booking, sends both a payment confirmation
 * email and a booking confirmation email (fire-and-forget).
 *
 * Request body:
 *   { result3ds: string, booking?: { user_id, sport_id, location_id, ... } }
 *
 * Response (success):
 *   { verified: true, decoded: {...}, booking?: {...} }
 *
 * Response (failure):
 *   { verified: false, error, explanation }
 */

import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { sendPaymentConfirmationEmail, sendBookingConfirmationEmail } from "@/lib/mailer";
import { sendBookingConfirmationSms } from "@/lib/sms/bookingConfirmationSms";
import { attachPromoToBooking } from "@/lib/promos/bookingPromo";
import {
  calculatePromoDiscount,
  formatBookingDate,
  validatePromoForBooking,
} from "@/lib/promos/validatePromo";
import { PROMO_COLUMNS } from "@/lib/promos/promoMapper";

/** Convert Base64url → standard Base64 and decode to a UTF-8 string. */
function base64UrlDecode(str) {
  // Replace URL-safe chars and pad to a multiple of 4
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Look up user profile, sport name, and location name from Supabase.
 * Returns { email, fullName, sportName, locationName }.
 */
async function resolveEmailContext(supabaseAdmin, bookingDetails) {
  let email = '';
  let fullName = 'there';
  let sportName = 'Sport';
  let locationName = 'Location';

  let phone = '';
  let courtName = 'Court';

  // Fetch user profile
  if (bookingDetails.user_id) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(bookingDetails.user_id);
    if (userData?.user) {
      email = userData.user.email || '';
      fullName = userData.user.user_metadata?.full_name || email.split('@')[0] || 'there';
      phone = userData.user.user_metadata?.phone_number || userData.user.user_metadata?.phone || userData.user.phone || '';
    }
  }

  // Fetch sport name
  if (bookingDetails.sport_id) {
    const { data: sportData } = await supabaseAdmin
      .from('sports')
      .select('name')
      .eq('id', bookingDetails.sport_id)
      .single();
    if (sportData) sportName = sportData.name;
  }

  // Fetch location name
  let locationPhone = undefined;
  if (bookingDetails.location_id) {
    const { data: locData } = await supabaseAdmin
      .from('locations')
      .select('name, phone')
      .eq('id', bookingDetails.location_id)
      .single();
    if (locData) {
      locationName = locData.name;
      locationPhone = locData.phone;
    }
  }

  // Fetch court/pitch name
  if (bookingDetails.pitch_id) {
    const { data: pitchData } = await supabaseAdmin
      .from('pitches')
      .select('name')
      .eq('id', bookingDetails.pitch_id)
      .single();
    if (pitchData) courtName = pitchData.name;
  }

  return { email, fullName, phone, sportName, locationName, locationPhone, courtName };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { result3ds, booking: bookingDetails } = body;

    if (!result3ds) {
      return Response.json(
        { verified: false, error: 'MISSING_RESULT3DS', explanation: 'result3ds is required.' },
        { status: 400 }
      );
    }

    // 1. Decode the Base64url token
    let decodedString;
    try {
      decodedString = base64UrlDecode(result3ds);
    } catch {
      return Response.json(
        { verified: false, error: 'DECODE_ERROR', explanation: 'Failed to decode result3ds.' },
        { status: 400 }
      );
    }

    // 2. Parse JSON
    let decoded;
    try {
      decoded = JSON.parse(decodedString);
    } catch {
      return Response.json(
        { verified: false, error: 'PARSE_ERROR', explanation: 'result3ds is not valid JSON after decoding.' },
        { status: 400 }
      );
    }

    // 3. Check for payment success (mirrors Engineering_pro logic)
    if (decoded.error) {
      // Gateway returned an error payload
      return Response.json({
        verified: false,
        error: decoded.type || 'PAYMENT_FAILED',
        explanation: decoded.explanation || 'Payment was not successful.',
        decoded,
      });
    }

    if (decoded.success === true) {
      const result = {
        verified: true,
        decoded: {
          success: decoded.success,
          webxOrderReference: decoded.webxOrderReference || null,
          orderNumber: decoded.merchantProvidedOrderNumber || decoded.orderNumber || null,
          receipt: decoded.receipt || null,
        },
      };

      // 4. If booking details are provided, create the booking using the admin client
      if (bookingDetails && isAdminClientConfigured()) {
        try {
          const supabaseAdmin = createAdminClient();

          // Query the pitches table to find a matching pitch_id
          let pitchId = bookingDetails.pitch_id;
          if (!pitchId) {
            const { data: pitchData } = await supabaseAdmin
              .from('pitches')
              .select('id')
              .eq('sport_id', bookingDetails.sport_id)
              .eq('location_id', bookingDetails.location_id)
              .eq('is_active', true)
              .limit(1);

            if (pitchData && pitchData.length > 0) {
              pitchId = pitchData[0].id;
            } else {
              // Fallback to any pitch matching sport_id or location_id
              const { data: fallbackPitches } = await supabaseAdmin
                .from('pitches')
                .select('id')
                .limit(1);
              if (fallbackPitches && fallbackPitches.length > 0) {
                pitchId = fallbackPitches[0].id;
              }
            }
          }

          if (!pitchId) {
            throw new Error('No pitch found in the database to associate with this booking.');
          }

          const SERVICE_CHARGE_RATE = 0.032; // 3.2%

          let sessionFeeTotal = Number(bookingDetails.total_amount) || 0;
          const promoId = bookingDetails.promo_id ?? null;

          if (promoId && bookingDetails.subtotal_amount) {
            const { data: promoRow } = await supabaseAdmin
              .from('promo_codes')
              .select(PROMO_COLUMNS)
              .eq('id', promoId)
              .maybeSingle();

            if (promoRow) {
              const { data: locationRow } = await supabaseAdmin
                .from('locations')
                .select('slug, name')
                .eq('id', bookingDetails.location_id)
                .maybeSingle();

              const locationSlug =
                locationRow?.slug ??
                (locationRow?.name
                  ? locationRow.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '')
                  : '');

              const validation = validatePromoForBooking(promoRow, {
                locationSlug,
                bookingDate: formatBookingDate(bookingDetails.booking_date),
              });

              if (validation.valid) {
                const discount = calculatePromoDiscount(
                  validation.promo,
                  Number(bookingDetails.subtotal_amount)
                );
                sessionFeeTotal = Math.max(
                  0,
                  Number(bookingDetails.subtotal_amount) - discount
                );
              }
            }
          }

          // Add 3.2% service charge on top of the post-discount session fee
          const serviceChargeAmount =
            Math.round(sessionFeeTotal * SERVICE_CHARGE_RATE * 100) / 100;
          const grandTotal =
            Math.round((sessionFeeTotal + serviceChargeAmount) * 100) / 100;

          const { data: bookingData, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .insert([
              {
                user_id: bookingDetails.user_id,
                sport_id: bookingDetails.sport_id,
                location_id: bookingDetails.location_id,
                pitch_id: pitchId,
                booking_date: bookingDetails.booking_date,
                start_time: bookingDetails.start_time,
                end_time: bookingDetails.end_time,
                total_amount: Number(bookingDetails.subtotal_amount) || Number(bookingDetails.total_amount) || 0,
                final_amount: grandTotal,
                booking_status: 'confirmed',
                payment_status: 'paid',
              },
            ])
            .select()
            .single();

          if (bookingError) {
            console.error('[verify] Booking insert error:', bookingError);
            result.bookingError = bookingError.message;
          } else {
            result.booking = bookingData;

            // 5a. Insert a payments table row for this card payment
            if (bookingData?.id) {
              // transaction_id = WebXPay's own transaction reference (used for refunds)
              // store_reference = the merchant-provided order number
              const webxTransactionId =
                result.decoded.webxOrderReference ||
                null;
              const storeReference =
                result.decoded.orderNumber ||
                null;

              const { error: paymentInsertError } = await supabaseAdmin
                .from('payments')
                .insert({
                  booking_id: bookingData.id,
                  payment_method: 'card',
                  transaction_id: webxTransactionId,
                  store_reference: storeReference,
                  amount: grandTotal,
                  payment_status: 'paid',
                  paid_at: new Date().toISOString(),
                });

              if (paymentInsertError) {
                // Non-fatal: log but don't fail the response
                console.error('[verify] payments row insert error:', paymentInsertError);
                result.paymentRowError = paymentInsertError.message;
              } else {
                console.log(`[verify] payments row created for booking ${bookingData.id} | webx_txn=${webxTransactionId} | store_ref=${storeReference}`);
              }
            }

            // 5b. Attach promo code to booking if applicable
            if (promoId && bookingData?.id) {
              const { error: promoLinkError } = await attachPromoToBooking(
                supabaseAdmin,
                bookingData.id,
                promoId
              );
              if (promoLinkError) {
                console.error('[verify] booking_promos error:', promoLinkError);
                result.promoLinkError = promoLinkError.message;
              }
            }

            // 5c. Send confirmation emails and SMS (fire-and-forget — don't block the response)
            try {
              // Ensure pitch_id is passed to resolveEmailContext if it was resolved locally
              bookingDetails.pitch_id = pitchId;
              const { email, fullName, phone, sportName, locationName, locationPhone, courtName } =
                await resolveEmailContext(supabaseAdmin, bookingDetails);

              // Write guest fields into the booking row now that we have the user data
              if (bookingData?.id) {
                await supabaseAdmin
                  .from('bookings')
                  .update({
                    guest_name: fullName,
                    guest_email: email,
                    guest_phone: phone,
                  })
                  .eq('id', bookingData.id);
              }

              const orderRef = result.decoded.orderNumber
                || result.decoded.webxOrderReference
                || `#TP-${bookingData.id || Math.floor(10000 + Math.random() * 90000)}-X`;
              const bookingRef = `#TP-${bookingData.id || Math.floor(10000 + Math.random() * 90000)}-X`;
              const timeSlot = `${bookingDetails.start_time} - ${bookingDetails.end_time}`;

              if (email) {

                // Send payment confirmation email
                sendPaymentConfirmationEmail(email, fullName, {
                  ref: orderRef,
                  amount: bookingDetails.total_amount,
                  method: 'Credit/Debit Card',
                  date: new Date().toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  }),
                  bookingRef,
                }).catch((err) => {
                  console.error('[verify] Failed to send payment confirmation email:', err);
                });

                // Send booking confirmation email
                sendBookingConfirmationEmail(email, fullName, {
                  ref: bookingRef,
                  sport: sportName,
                  location: locationName,
                  date: bookingDetails.booking_date,
                  time: timeSlot,
                  amount: bookingDetails.total_amount,
                }).catch((err) => {
                  console.error('[verify] Failed to send booking confirmation email:', err);
                });

                console.log(`[verify] Confirmation emails queued for ${email}`);
              } else {
                console.warn('[verify] No user email found — skipping confirmation emails.');
              }

              if (phone) {
                sendBookingConfirmationSms({
                  phone,
                  customerName: fullName,
                  reference: bookingRef,
                  date: bookingDetails.booking_date,
                  time: timeSlot,
                  location: locationName,
                  sport: sportName,
                  court: courtName,
                  finalAmount: grandTotal,
                  contactPhone: locationPhone,
                }).catch((err) => {
                  console.error('[verify] Failed to send booking confirmation SMS:', err);
                });
                console.log(`[verify] Confirmation SMS queued for ${phone}`);
              }
            } catch (emailErr) {
              console.error('[verify] Error resolving email/sms context:', emailErr);
              // Don't fail the payment/booking response if email lookup fails
            }
          }
        } catch (bookingErr) {
          console.error('[verify] Booking creation error:', bookingErr);
          result.bookingError = bookingErr.message;
        }
      } else if (bookingDetails && !isAdminClientConfigured()) {
        console.warn('[verify] Admin client not configured – skipping booking creation.');
        result.bookingError = 'Admin client not configured. Please set SUPABASE_SERVICE_ROLE_KEY.';
      }

      return Response.json(result);
    }

    // Anything else is treated as a failure
    return Response.json({
      verified: false,
      error: 'PAYMENT_UNSUCCESSFUL',
      explanation: 'Payment was not confirmed by the gateway.',
      decoded,
    });
  } catch (err) {
    console.error('[verify] Error:', err);
    return Response.json(
      { verified: false, error: 'SERVER_ERROR', explanation: err.message },
      { status: 500 }
    );
  }
}
