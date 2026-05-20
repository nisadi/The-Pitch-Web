import { DEFAULT_ROLE_ID, resolveRoleId } from "./userRoles";

export const USERS_STORAGE_KEY = "the_pitch_admin_users_v3";

export { DEFAULT_USER_ROLES, USER_ROLES, roleCanInvite, roleCanManageUsers } from "./userRoles";

export const OWNER_EMAIL = "admin@thepitch.com";

export const USER_STATUSES = {
  active: { label: "Active", color: "#22c55e" },
  disabled: { label: "Disabled", color: "#6b7280" },
};

export function compareUsers(a, b) {
  const aIsOwner = a?.email === OWNER_EMAIL;
  const bIsOwner = b?.email === OWNER_EMAIL;
  if (aIsOwner !== bIsOwner) return aIsOwner ? -1 : 1;
  return (a?.name ?? "").localeCompare(b?.name ?? "");
}

export const DEFAULT_TEAM_USERS = [
  {
    id: "usr-admin-001",
    name: "Admin User",
    email: "admin@thepitch.com",
    roleId: "admin",
    status: "active",
  },
  {
    id: "usr-manager-001",
    name: "Jane Fernando",
    email: "jane.manager@thepitch.com",
    roleId: "manager",
    status: "active",
  },
  {
    id: "usr-staff-001",
    name: "Kamal Silva",
    email: "kamal.staff@thepitch.com",
    roleId: "staff",
    status: "active",
  },
];

export function normalizeUser(user) {
  const roleId = resolveRoleId(user.roleId ?? user.role_id ?? user.role);
  const rawStatus = user.status === "disabled" ? "disabled" : "active";
  const status = USER_STATUSES[rawStatus] ? rawStatus : "active";

  return {
    id: String(user.id ?? ""),
    name: user.name?.trim() ?? user.user_name?.trim() ?? "",
    email: user.email?.trim().toLowerCase() ?? "",
    roleId,
    role: roleId,
    status,
    displayPassword:
      user.displayPassword ?? user.display_password ?? "",
  };
}

export function slugifyUserId(email) {
  const local = email.split("@")[0] ?? "user";
  return `usr-${local.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;
}

/** Map app user → public.role row (password set separately via RPC) */
export function userToRoleRow(user) {
  const normalized = normalizeUser(user);
  return {
    id: normalized.id || undefined,
    user_name: normalized.name,
    email: normalized.email,
    role: normalized.roleId,
    status: normalized.status,
  };
}

/** Map public.role row → app user (never includes password) */
export function userFromRoleRow(row) {
  if (!row) return null;
  return normalizeUser({
    id: row.id,
    name: row.user_name ?? row.name,
    email: row.email,
    roleId: row.role ?? row.role_id ?? row.roleId,
    status: row.status,
    display_password: row.display_password,
  });
}

/** @deprecated Use userFromRoleRow */
export function userFromDbRow(row) {
  return userFromRoleRow(row);
}

/** @deprecated Use userToRoleRow */
export function userToDbRow(user) {
  return userToRoleRow(user);
}
