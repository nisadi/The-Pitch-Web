import { createClient } from "@/lib/supabase/server";

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
    const { sport_id, location_id, pitch_id, booking_date, start_time, end_time, total_amount } = body;

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          user_id: user.id, // always use the server-verified user id
          sport_id,
          location_id,
          pitch_id: pitch_id || null,
          booking_date,
          start_time,
          end_time,
          total_amount,
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

    return Response.json({ booking: data });
  } catch (err) {
    console.error("[api/bookings/create] Unexpected error:", err);
    return Response.json({ error: "SERVER_ERROR", explanation: err.message }, { status: 500 });
  }
}
