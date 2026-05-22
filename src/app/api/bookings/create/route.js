import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmationEmail } from "@/lib/mailer";

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

    // Send booking confirmation email (fire-and-forget, don't block response)
    try {
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';

      // Fetch sport and location names for the email
      let sportName = 'Sport';
      let locationName = 'Location';

      if (sport_id) {
        const { data: sportData } = await supabase.from('sports').select('name').eq('id', sport_id).single();
        if (sportData) sportName = sportData.name;
      }
      if (location_id) {
        const { data: locData } = await supabase.from('locations').select('name').eq('id', location_id).single();
        if (locData) locationName = locData.name;
      }

      const bookingRef = `#TP-${data.id || Math.floor(10000 + Math.random() * 90000)}-X`;

      await sendBookingConfirmationEmail(user.email, fullName, {
        ref: bookingRef,
        sport: sportName,
        location: locationName,
        date: booking_date,
        time: `${start_time} - ${end_time}`,
        amount: total_amount,
      });
    } catch (emailErr) {
      console.error("[api/bookings/create] Failed to send booking email:", emailErr);
      // Don't fail the booking if email fails
    }

    return Response.json({ booking: data });
  } catch (err) {
    console.error("[api/bookings/create] Unexpected error:", err);
    return Response.json({ error: "SERVER_ERROR", explanation: err.message }, { status: 500 });
  }
}

