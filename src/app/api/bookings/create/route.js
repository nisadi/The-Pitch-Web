import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmationEmail } from "@/lib/mailer";
import { attachPromoToBooking } from "@/lib/promos/bookingPromo";
import {
  calculatePromoDiscount,
  formatBookingDate,
  validatePromoForBooking,
} from "@/lib/promos/validatePromo";
import { PROMO_COLUMNS } from "@/lib/promos/promoMapper";
import { findBookingRangeConflict } from "@/lib/bookings/bookingConflicts";
import { resolvePitchId } from "@/lib/bookings/bookingMutations";
import { sendBookingConfirmationSms } from "@/lib/sms/bookingConfirmationSms";

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Verify the caller is authenticated (reads from cookies set by middleware)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "UNAUTHORIZED", explanation: "You must be logged in to create a booking." }, { status: 401 });
    }

    const body = await request.json();
    const {
      sport_id,
      location_id,
      pitch_id,
      booking_date,
      start_time,
      end_time,
      total_amount,
      promo_id,
      subtotal_amount,
    } = body;

    let finalTotal = Number(total_amount) || 0;
    let resolvedPromoId = promo_id ?? null;

    if (resolvedPromoId && subtotal_amount) {
      const { data: promoRow, error: promoFetchError } = await supabase
        .from("promo_codes")
        .select(PROMO_COLUMNS)
        .eq("id", resolvedPromoId)
        .maybeSingle();

      if (promoFetchError || !promoRow) {
        return Response.json(
          {
            error: "INVALID_PROMO",
            explanation: "Promo code could not be applied.",
          },
          { status: 400 }
        );
      }

      const { data: locationRow } = await supabase
        .from("locations")
        .select("slug, name")
        .eq("id", location_id)
        .maybeSingle();

      const locationSlug =
        locationRow?.slug ??
        (locationRow?.name
          ? locationRow.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
          : "");

      const validation = validatePromoForBooking(promoRow, {
        locationSlug,
        bookingDate: formatBookingDate(booking_date),
      });

      if (!validation.valid) {
        return Response.json(
          { error: "INVALID_PROMO", explanation: validation.error },
          { status: 400 }
        );
      }

      const discount = calculatePromoDiscount(
        validation.promo,
        Number(subtotal_amount)
      );
      finalTotal = Math.max(0, Number(subtotal_amount) - discount);
    }

    const dateKey = formatBookingDate(booking_date) || booking_date;

    const resolvedPitchId = await resolvePitchId(supabase, {
      location_id,
      sport_id,
      pitch_id,
    });

    if (!resolvedPitchId) {
      return Response.json(
        {
          error: "NO_PITCH",
          explanation:
            "No active court is configured for this location and sport.",
        },
        { status: 400 }
      );
    }

    if (start_time && end_time && location_id) {
      const conflict = await findBookingRangeConflict(supabase, {
        location_id,
        pitch_id: resolvedPitchId,
        booking_date: dateKey,
        start_time,
        end_time,
      });

      if (conflict) {
        return Response.json(
          {
            error: "SLOT_UNAVAILABLE",
            explanation:
              conflict.booking_status === "blocked"
                ? "This time slot is blocked and not available to book."
                : "This time slot is already booked.",
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          user_id: user.id, // always use the server-verified user id
          sport_id,
          location_id,
          pitch_id: resolvedPitchId,
          booking_date,
          start_time,
          end_time,
          total_amount: Number(total_amount) || 0,
          final_amount: finalTotal,
          booking_status: "confirmed",
          payment_status: "paid",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[api/bookings/create] Supabase error:", error);
      return Response.json({ error: "DB_ERROR", explanation: error.message }, { status: 500 });
    }

    if (resolvedPromoId) {
      const { error: promoLinkError } = await attachPromoToBooking(
        supabase,
        data.id,
        resolvedPromoId
      );
      if (promoLinkError) {
        console.error("[api/bookings/create] booking_promos error:", promoLinkError);
      }
    }

    // Send booking confirmation email and SMS (fire-and-forget, don't block response)
    try {
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';
      const phone = user.user_metadata?.phone_number || user.user_metadata?.phone || user.phone;

      // Fetch sport, location and pitch names for the email/sms
      let sportName = 'Sport';
      let locationName = 'Location';
      let courtName = 'Court';
      let contactPhone = undefined;

      if (sport_id) {
        const { data: sportData } = await supabase.from('sports').select('name').eq('id', sport_id).single();
        if (sportData) sportName = sportData.name;
      }
      if (location_id) {
        const { data: locData } = await supabase.from('locations').select('name, phone').eq('id', location_id).single();
        if (locData) {
          locationName = locData.name;
          contactPhone = locData.phone;
        }
      }
      if (resolvedPitchId) {
        const { data: pitchData } = await supabase.from('pitches').select('name').eq('id', resolvedPitchId).single();
        if (pitchData) courtName = pitchData.name;
      }

      const bookingRef = `#TP-${data.id || Math.floor(10000 + Math.random() * 90000)}-X`;

      await sendBookingConfirmationEmail(user.email, fullName, {
        ref: bookingRef,
        sport: sportName,
        location: locationName,
        date: booking_date,
        time: `${start_time} - ${end_time}`,
        amount: finalTotal,
      });

      if (phone) {
        await sendBookingConfirmationSms({
          phone,
          customerName: fullName,
          reference: bookingRef,
          date: booking_date,
          time: `${start_time} - ${end_time}`,
          location: locationName,
          sport: sportName,
          court: courtName,
          finalAmount: finalTotal,
          contactPhone,
        });
      }
    } catch (notificationErr) {
      console.error("[api/bookings/create] Failed to send booking notification:", notificationErr);
      // Don't fail the booking if email/sms fails
    }

    return Response.json({ booking: data });
  } catch (err) {
    console.error("[api/bookings/create] Unexpected error:", err);
    return Response.json({ error: "SERVER_ERROR", explanation: err.message }, { status: 500 });
  }
}

