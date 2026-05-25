import { NextResponse } from "next/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  BOOKING_CALENDAR_SELECT,
  calendarBookingFromRow,
} from "@/lib/bookings/bookingMapper";
import { insertCalendarBooking } from "@/lib/bookings/bookingMutations";

export async function GET(request) {
  if (!isSupabaseConfigured() || !isAdminClientConfigured()) {
    return NextResponse.json({ bookings: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    if (!locationId || !fromDate || !toDate) {
      return NextResponse.json(
        { error: "location_id, from, and to are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_CALENDAR_SELECT)
      .eq("location_id", locationId)
      .gte("booking_date", fromDate)
      .lte("booking_date", toDate)
      .order("booking_date")
      .order("start_time");

    if (error) throw error;

    return NextResponse.json({
      bookings: (data ?? []).map(calendarBookingFromRow).filter(Boolean),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();

    if (!isAdminClientConfigured()) {
      return NextResponse.json(
        {
          error:
            "Admin booking API is not configured on the server. Use the in-app save (requires bookings insert policy) or set SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 503 }
      );
    }

    const supabase = createAdminClient();
    const result = await insertCalendarBooking(supabase, {
      ...body,
      fallbackUserId: process.env.ADMIN_BOOKING_USER_ID?.trim(),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ booking: result.booking });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to create booking" },
      { status: 500 }
    );
  }
}
