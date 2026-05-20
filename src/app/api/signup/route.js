import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { email, password, fullName, phone } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return Response.json(
        { error: "NO_SERVICE_ROLE_KEY", message: "SUPABASE_SERVICE_ROLE_KEY is not defined on the server." },
        { status: 400 }
      );
    }

    // Initialize Supabase Admin client using the secret service_role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create the user and automatically confirm their email
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone_number: phone
      }
    });

    if (error) {
      return Response.json({ error: "SIGNUP_ERROR", message: error.message }, { status: 400 });
    }

    return Response.json({ user: data.user, success: true });
  } catch (err) {
    return Response.json({ error: "SERVER_ERROR", message: err.message }, { status: 500 });
  }
}
