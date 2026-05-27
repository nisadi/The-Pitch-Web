import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, phone, avatar } = body;

    const supabaseAdmin = createAdminClient();

    // Verify the user from the JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("[profile/update] Auth error:", authError?.message);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Update the public.users table
    const { data, error: dbError } = await supabaseAdmin
      .from("users")
      .update({
        full_name: name,
        email: email,
        phone: phone,
        avatar_url: avatar || null
      })
      .eq("id", user.id)
      .select();

    if (dbError) {
      console.error("[profile/update] DB error:", dbError.message);
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    console.log("[profile/update] Updated user", user.id, "rows:", data?.length);
    return NextResponse.json({ success: true, updated: data });
  } catch (err) {
    console.error("[profile/update] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
