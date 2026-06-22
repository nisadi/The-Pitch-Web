import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      organizationName,
      contactPerson,
      email,
      phone,
      location,
      eventCategory,
      guestCount,
      preferredDate,
      requirements
    } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Fallback: If service role key is not defined, we return NO_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return Response.json(
        { error: "NO_SERVICE_ROLE_KEY", message: "SUPABASE_SERVICE_ROLE_KEY is not defined on the server." },
        { status: 400 }
      );
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const emailKey = email?.trim().toLowerCase();
    const phoneKey = phone?.replace(/\D/g, "");
    const threadKey = emailKey
      ? `email:${emailKey}`
      : phoneKey
        ? `phone:${phoneKey}`
        : null;

    const referenceCode = `EVT-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    // Insert directly using Admin client to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('event_inquiries')
      .insert([
        {
          reference_code: referenceCode,
          thread_key: threadKey,
          organization_name: organizationName,
          contact_person: contactPerson,
          email,
          phone,
          location,
          event_category: eventCategory,
          guest_count: guestCount ? parseInt(guestCount, 10) : null,
          preferred_date: preferredDate || null,
          requirements,
          subject: eventCategory || organizationName || 'Event inquiry',
          status: 'new',
          replies: [],
        }
      ])
      .select()
      .single();

    if (error) {
      return Response.json({ error: "DB_ERROR", message: error.message }, { status: 400 });
    }

    return Response.json({ success: true, data });
  } catch (err) {
    return Response.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
