import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  BOOKING_CALENDAR_SELECT,
  calendarBookingFromRow,
  hoursToDbRange,
} from "./bookingMapper";
import { findBookingRangeConflict } from "./bookingConflicts";
import { isRangeBookable } from "@/lib/booking/bookingSlots";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

/** DB requires pitch_id; resolved from admin location + sport (no UI picker). */
export async function resolvePitchId(
  supabase,
  { location_id, sport_id, pitch_id }
) {
  if (pitch_id && isUuid(String(pitch_id))) {
    return String(pitch_id);
  }

  if (sport_id && isUuid(String(sport_id))) {
    const { data: byLegacy, error: legacyError } = await supabase
      .from("pitches")
      .select("id, sport_id, sport_ids")
      .eq("location_id", location_id)
      .eq("sport_id", sport_id)
      .eq("is_active", true)
      .order("name")
      .limit(1)
      .maybeSingle();

    if (legacyError) throw legacyError;
    if (byLegacy?.id) return byLegacy.id;

    const { data: atLocation, error: listError } = await supabase
      .from("pitches")
      .select("id, sport_id, sport_ids")
      .eq("location_id", location_id)
      .eq("is_active", true)
      .order("name");

    if (listError) throw listError;
    const match = (atLocation ?? []).find((row) => {
      const ids = Array.isArray(row.sport_ids) ? row.sport_ids : [];
      return (
        ids.map(String).includes(String(sport_id)) ||
        String(row.sport_id) === String(sport_id)
      );
    });
    if (match?.id) return match.id;
  }

  const { data: atLocation, error: locError } = await supabase
    .from("pitches")
    .select("id")
    .eq("location_id", location_id)
    .eq("is_active", true)
    .order("name")
    .limit(1)
    .maybeSingle();

  if (locError) throw locError;
  return atLocation?.id ?? null;
}

export async function resolveBookingUserId(supabase, { fallbackUserId } = {}) {
  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (userRow?.id) return userRow.id;

  const { data: bookingRow } = await supabase
    .from("bookings")
    .select("user_id")
    .not("user_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (bookingRow?.user_id) return bookingRow.user_id;

  if (fallbackUserId && isUuid(fallbackUserId)) return fallbackUserId;

  return null;
}

export function validateAdminBookingPayload(body) {
  const {
    type = "block",
    location_id,
    sport_id,
    booking_date,
    start_hour,
    end_hour,
  } = body ?? {};

  if (!location_id || !sport_id || !booking_date || start_hour == null) {
    return { error: "location_id, sport_id, booking_date, and start_hour are required" };
  }

  if (!isUuid(location_id)) {
    return { error: "Invalid location — save the location in Settings first." };
  }

  if (!isUuid(sport_id)) {
    return { error: "Invalid sport — save the sport in Settings first." };
  }

  const start = Number(start_hour);
  const end =
    end_hour != null ? Number(end_hour) : Number(start_hour) + 1;

  if (!Number.isFinite(start) || start < 0 || start > 23) {
    return { error: "Invalid start_hour" };
  }

  if (!Number.isFinite(end) || end <= start || end > 24) {
    return { error: "Invalid end_hour — must be after start time." };
  }

  if (!isRangeBookable(booking_date, start, end)) {
    return { error: "Cannot book or block a date/time in the past." };
  }

  const isBlock = type === "block";
  if (!isBlock && !String(body.customer_name ?? "").trim()) {
    return { error: "Customer name is required for manual bookings." };
  }

  return {
    type,
    location_id,
    sport_id,
    pitch_id: body.pitch_id?.trim() || null,
    booking_date,
    start,
    end,
    customer_name: body.customer_name,
    customer_email: body.customer_email,
    customer_phone: body.customer_phone,
    total_amount: body.total_amount,
  };
}

export async function insertCalendarBooking(supabase, payload) {
  const validated = validateAdminBookingPayload(payload);
  if (validated.error) {
    return { error: validated.error, status: 400 };
  }

  const {
    type,
    location_id,
    sport_id,
    pitch_id,
    booking_date,
    start,
    end,
    customer_name,
    customer_email,
    customer_phone,
    total_amount,
  } = validated;

  const { start_time, end_time } = hoursToDbRange(start, end);

  const conflict = await findBookingRangeConflict(supabase, {
    location_id,
    booking_date,
    start_time,
    end_time,
  });

  if (conflict) {
    return {
      error: "One or more hours in this range are already booked or blocked.",
      status: 409,
    };
  }

  const userId = await resolveBookingUserId(supabase, {
    fallbackUserId: payload.fallbackUserId,
  });
  if (!userId) {
    return {
      error:
        "No user record available to attach the booking. Add a customer in Admin or set ADMIN_BOOKING_USER_ID.",
      status: 500,
    };
  }

  const resolvedPitchId = await resolvePitchId(supabase, {
    location_id,
    sport_id,
    pitch_id,
  });

  if (!resolvedPitchId) {
    return {
      error:
        "No active court for this location. Add a pitch in Admin → Settings.",
      status: 400,
    };
  }

  const isBlock = type === "block";
  const durationHours = end - start;

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      sport_id,
      location_id,
      pitch_id: resolvedPitchId,
      booking_date,
      start_time,
      end_time,
      total_amount: isBlock ? 0 : Number(total_amount) || 0,
      booking_status: isBlock ? "blocked" : "confirmed",
      payment_status: isBlock ? "paid" : "unpaid",
      guest_name: isBlock ? null : customer_name?.trim() || null,
      guest_email: isBlock ? null : customer_email?.trim() || null,
      guest_phone: isBlock ? null : customer_phone?.trim() || null,
    })
    .select(BOOKING_CALENDAR_SELECT)
    .single();

  if (error) {
    const message = error.message ?? "Failed to create booking";
    if (
      isBlock &&
      (message.includes("bookings_booking_status_check") ||
        message.includes("booking_status"))
    ) {
      return {
        error:
          "Blocked status is not enabled in the database yet. Apply migration 00037_booking_status_blocked_check.sql to your Supabase project.",
        status: 500,
      };
    }
    return { error: message, status: 500 };
  }

  const booking = calendarBookingFromRow(data);
  booking.durationHours = durationHours;

  return { booking, status: 200 };
}

/** Browser admin calendar create (anon RLS insert policy). */
export async function createCalendarBookingClient(payload) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured.", status: 503 };
  }

  const supabase = createClient();
  return insertCalendarBooking(supabase, payload);
}

/** Cancel a booking or remove a blocked slot (anon RLS update policy). */
export async function cancelCalendarBookingClient(bookingId) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured.", status: 503 };
  }

  if (!bookingId || !isUuid(String(bookingId))) {
    return { error: "Invalid booking id.", status: 400 };
  }

  const supabase = createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("id, booking_status")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message, status: 500 };
  }

  if (!existing) {
    return { error: "Booking not found.", status: 404 };
  }

  if (existing.booking_status === "cancelled") {
    return { error: "Booking is already cancelled.", status: 400 };
  }

  const { data, error } = await supabase
    .from("bookings")
    .update({ booking_status: "cancelled" })
    .eq("id", bookingId)
    .select(BOOKING_CALENDAR_SELECT)
    .single();

  if (error) {
    return { error: error.message, status: 500 };
  }

  return { booking: calendarBookingFromRow(data), status: 200 };
}
