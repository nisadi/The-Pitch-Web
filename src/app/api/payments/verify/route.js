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

/** Convert Base64url → standard Base64 and decode to a UTF-8 string. */
function base64UrlDecode(str) {
  // Replace URL-safe chars and pad to a multiple of 4
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf-8');
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
                total_amount: bookingDetails.total_amount,
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
