import { NextResponse } from "next/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  BOOKING_CALENDAR_SELECT,
  calendarBookingFromRow,
  hoursToDbRange,
} from "@/lib/bookings/bookingMapper";
import { isRangeBookable } from "@/lib/booking/bookingSlots";
import { findBookingRangeConflict } from "@/lib/bookings/bookingConflicts";
import { resolvePitchId } from "@/lib/bookings/bookingMutations";

export async function PATCH(request, { params }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json(
      { error: "Admin booking API is not configured on the server." },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action;
    const supabase = createAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("bookings")
      .select(BOOKING_CALENDAR_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (action === "cancel") {
      if (existing.booking_status === "cancelled") {
        return NextResponse.json(
          { error: "Booking is already cancelled." },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("bookings")
        .update({ booking_status: "cancelled" })
        .eq("id", id)
        .select(BOOKING_CALENDAR_SELECT)
        .single();

      if (error) throw error;
      return NextResponse.json({ booking: calendarBookingFromRow(data) });
    }

    if (action === "mark_paid") {
      const { data, error } = await supabase
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", id)
        .select(BOOKING_CALENDAR_SELECT)
        .single();

      if (error) throw error;
      return NextResponse.json({ booking: calendarBookingFromRow(data) });
    }

    if (action === "reschedule") {
      const booking_date = body.booking_date ?? existing.booking_date;
      const start_hour =
        body.start_hour != null
          ? Number(body.start_hour)
          : parseInt(String(existing.start_time).split(":")[0], 10);

      const existingEndHour = parseInt(
        String(existing.end_time).split(":")[0],
        10
      );
      const end_hour =
        body.end_hour != null ? Number(body.end_hour) : existingEndHour;

      if (!booking_date || !Number.isFinite(start_hour)) {
        return NextResponse.json(
          { error: "booking_date and start_hour are required to reschedule" },
          { status: 400 }
        );
      }

      if (!Number.isFinite(end_hour) || end_hour <= start_hour) {
        return NextResponse.json(
          { error: "end_hour must be after start_hour" },
          { status: 400 }
        );
      }

      if (!isRangeBookable(booking_date, start_hour, end_hour)) {
        return NextResponse.json(
          { error: "Cannot reschedule to a date/time in the past." },
          { status: 400 }
        );
      }

      const { start_time, end_time } = hoursToDbRange(start_hour, end_hour);

      const sportId = body.sport_id ?? existing.sport_id;

      const resolvedPitchId = await resolvePitchId(supabase, {
        location_id: existing.location_id,
        sport_id: sportId,
        pitch_id: body.pitch_id ?? existing.pitch_id,
      });

      if (!resolvedPitchId) {
        return NextResponse.json(
          {
            error:
              "No active pitch/court for this location and sport. Add one in Settings.",
          },
          { status: 400 }
        );
      }

      const conflict = await findBookingRangeConflict(supabase, {
        location_id: existing.location_id,
        pitch_id: resolvedPitchId,
        booking_date,
        start_time,
        end_time,
        excludeId: id,
      });

      if (conflict) {
        return NextResponse.json(
          { error: "One or more hours in this range are already booked or blocked." },
          { status: 409 }
        );
      }

      const updates = {
        booking_date,
        start_time,
        end_time,
        pitch_id: resolvedPitchId,
      };

      if (body.sport_id) updates.sport_id = body.sport_id;

      const { data, error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", id)
        .select(BOOKING_CALENDAR_SELECT)
        .single();

      if (error) throw error;
      return NextResponse.json({ booking: calendarBookingFromRow(data) });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to update booking" },
      { status: 500 }
    );
  }
}
