import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      organizationName,
      contactPerson,
      email,
      phone,
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

    // Insert directly using Admin client to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('event_inquiries')
      .insert([
        {
          organization_name: organizationName,
          contact_person: contactPerson,
          email,
          phone,
          event_category: eventCategory,
          guest_count: guestCount ? parseInt(guestCount, 10) : null,
          preferred_date: preferredDate || null,
          requirements
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
