import { NextResponse } from "next/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { userFromRoleRow } from "@/lib/users/usersDefaults";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ users: [] });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json({ users: [] });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("role")
      .select("id, user_name, email, role, status, created_at, updated_at")
      .order("user_name");

    if (error) throw error;

    return NextResponse.json({
      users: (data ?? []).map(userFromRoleRow).filter(Boolean),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to load users" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json(
      { error: "Server writes use Supabase RPC from the browser." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("upsert_role_user", {
      p_id: null,
      p_user_name: body.name?.trim(),
      p_email: body.email?.trim().toLowerCase(),
      p_role: body.roleId ?? body.role ?? "staff",
      p_status: body.status ?? "active",
      p_password: body.password ?? null,
    });

    if (error) throw error;

    const { data: row, error: fetchError } = await supabase
      .from("role")
      .select("id, user_name, email, role, status, created_at, updated_at")
      .eq("id", data)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({ user: userFromRoleRow(row) });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to create user" },
      { status: 500 }
    );
  }
}
