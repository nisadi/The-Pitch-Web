import { createClient } from "@/lib/supabase/client";
import { userFromRoleRow } from "./usersDefaults";
import { isValidUuid } from "./userIds";

const ROLE_COLUMNS =
  "id, user_name, email, role, status, display_password, created_at, updated_at";

async function fetchRoleRow(supabase, { id, email }) {
  let query = supabase.from("role").select(ROLE_COLUMNS);

  if (isValidUuid(id)) {
    query = query.eq("id", id);
  } else if (email) {
    query = query.eq("email", email.trim().toLowerCase());
  } else {
    throw new Error("Missing user id or email");
  }

  const { data, error } = await query.single();
  if (error) throw error;
  return userFromRoleRow(data);
}

export async function upsertRoleUserClient(payload) {
  const supabase = createClient();
  const email = payload.email?.trim().toLowerCase();
  const idForRpc = isValidUuid(payload.id) ? payload.id : null;

  const { data: userId, error } = await supabase.rpc("upsert_role_user", {
    p_id: idForRpc,
    p_user_name: payload.name?.trim(),
    p_email: email,
    p_role: payload.roleId ?? payload.role ?? "staff",
    p_status: payload.status ?? "active",
    p_password: payload.password ?? null,
  });

  if (error) {
    const patch = {
      user_name: payload.name?.trim(),
      role: payload.roleId ?? payload.role ?? "staff",
      status: payload.status ?? "active",
      updated_at: new Date().toISOString(),
    };

    let updateQuery = supabase.from("role").update(patch);
    if (isValidUuid(payload.id)) {
      updateQuery = updateQuery.eq("id", payload.id);
    } else {
      updateQuery = updateQuery.eq("email", email);
    }

    const { data: row, error: updateError } = await updateQuery
      .select(ROLE_COLUMNS)
      .single();

    if (updateError) throw updateError;
    return userFromRoleRow(row);
  }

  return fetchRoleRow(supabase, { id: userId, email });
}

export async function deleteRoleUserClient({ id, email }) {
  const supabase = createClient();

  if (isValidUuid(id)) {
    const { error } = await supabase.rpc("delete_role_user", { p_id: id });
    if (!error) return;

    const { error: deleteError } = await supabase.from("role").delete().eq("id", id);
    if (deleteError) throw deleteError;
    return;
  }

  const { error } = await supabase
    .from("role")
    .delete()
    .eq("email", email?.trim().toLowerCase());

  if (error) throw error;
}
