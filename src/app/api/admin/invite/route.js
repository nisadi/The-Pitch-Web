import { NextResponse } from "next/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function POST(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json(
      { error: "Server invite requires SUPABASE_SERVICE_ROLE_KEY to be configured." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const fullName = (body.fullName ?? "").trim();
    const phone = (body.phone ?? "").trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Derive the site origin from the request so this works on any deployment
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "";
    // Redirect to /signup so the invited user can set their password
    const redirectTo = `${origin}/signup`;

    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        full_name: fullName,
        phone_number: phone,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to send invite" },
      { status: 500 }
    );
  }
}
