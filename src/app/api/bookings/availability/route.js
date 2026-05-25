import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ bookings: [] });
  }

  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("location_id");
    const date = searchParams.get("date");
    const pitchId = searchParams.get("pitch_id");

    if (!locationId || !date) {
      return NextResponse.json(
        { error: "location_id and date are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let query = supabase
      .from("bookings")
      .select(
        "id, booking_date, start_time, end_time, booking_status, sport_id, pitch_id"
      )
      .eq("location_id", locationId)
      .eq("booking_date", date)
      .not("booking_status", "eq", "cancelled");

    if (pitchId) {
      query = query.eq("pitch_id", pitchId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ bookings: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load availability" },
      { status: 500 }
    );
  }
}
