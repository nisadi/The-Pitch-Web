import { NextResponse } from "next/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { userFromRoleRow } from "@/lib/users/usersDefaults";

export async function PATCH(request, { params }) {
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
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const { data: existing, error: loadError } = await supabase
      .from("role")
      .select("id, user_name, email, role, status")
      .eq("id", id)
      .single();

    if (loadError) throw loadError;

    const { data: userId, error } = await supabase.rpc("upsert_role_user", {
      p_id: id,
      p_user_name: body.name?.trim() ?? existing.user_name,
      p_email: body.email?.trim().toLowerCase() ?? existing.email,
      p_role: body.roleId ?? body.role ?? existing.role,
      p_status: body.status ?? existing.status,
      p_password: body.password ?? null,
    });

    if (error) throw error;

    const { data: row, error: fetchError } = await supabase
      .from("role")
      .select("id, user_name, email, role, status, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({ user: userFromRoleRow(row) });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
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
    const { id } = await params;
    const supabase = createAdminClient();
    const { error } = await supabase.from("role").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to delete user" },
      { status: 500 }
    );
  }
}
