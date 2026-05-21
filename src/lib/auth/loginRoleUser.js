import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { normalizeUser } from "@/lib/users/usersDefaults";

export async function loginRoleUser(email, password) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("login_role_user", {
    p_email: email.trim().toLowerCase(),
    p_password: password,
  });

  if (error) throw error;

  if (!data?.ok) {
    throw new Error(data?.error ?? "Login failed");
  }

  return normalizeUser({
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    roleId: data.user.roleId,
    status: data.user.status,
  });
}
