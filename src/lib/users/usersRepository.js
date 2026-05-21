import { isSupabaseConfigured } from "@/lib/supabase/env";
import { userFromRoleRow } from "./usersDefaults";
import { deleteRoleUserClient, upsertRoleUserClient } from "./roleMutations";
import { sortRoles, DEFAULT_USER_ROLES } from "./userRoles";

export async function fetchUserRoles() {
  return DEFAULT_USER_ROLES;
}

async function createViaApi(payload) {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? "Failed to create user");
  return userFromRoleRow(json.user);
}

async function updateViaApi(id, patch) {
  const response = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error ?? "Failed to update user");
  return userFromRoleRow(json.user);
}

async function deleteViaApi(id) {
  const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error ?? "Failed to delete user");
  }
}

export async function fetchTeamUsers() {
  try {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    if (!response.ok) return null;
    const json = await response.json();
    if (!Array.isArray(json.users)) return null;
    return json.users.map(userFromRoleRow).filter(Boolean);
  } catch {
    return null;
  }
}

export async function createTeamUser(payload) {
  if (isSupabaseConfigured()) {
    return upsertRoleUserClient(payload);
  }
  return createViaApi(payload);
}

export async function updateTeamUser(user, patch) {
  if (isSupabaseConfigured()) {
    return upsertRoleUserClient({
      id: user.id,
      name: patch.name ?? user.name,
      email: patch.email ?? user.email,
      roleId: patch.roleId ?? patch.role ?? user.roleId,
      status: patch.status ?? user.status,
      password: patch.password,
    });
  }
  return updateViaApi(user.id, patch);
}

export async function deleteTeamUser(user) {
  if (isSupabaseConfigured()) {
    return deleteRoleUserClient({ id: user.id, email: user.email });
  }
  return deleteViaApi(user.id);
}

export { sortRoles };
