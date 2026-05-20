/** Mirrors public.user_roles — keep in sync with supabase/migrations/00002_*.sql */

export const DEFAULT_USER_ROLES = [
  {
    id: "admin",
    label: "Admin",
    color: "#a855f7",
    description: "Full access. Can invite and manage all users.",
    canInvite: true,
    canManageUsers: true,
    sortOrder: 1,
  },
  {
    id: "manager",
    label: "Manager",
    color: "#3b82f6",
    description: "Manage bookings, customers, and day-to-day operations.",
    canInvite: false,
    canManageUsers: false,
    sortOrder: 2,
  },
  {
    id: "staff",
    label: "Staff",
    color: "#22c55e",
    description: "Front-desk access for bookings and check-ins.",
    canInvite: false,
    canManageUsers: false,
    sortOrder: 3,
  },
];

export const USER_ROLES = Object.fromEntries(
  DEFAULT_USER_ROLES.map((role) => [role.id, role])
);

export const DEFAULT_ROLE_ID = "staff";

export function getRoleById(roleId) {
  return USER_ROLES[roleId] ?? null;
}

export function resolveRoleId(roleIdOrLegacyRole) {
  const id = roleIdOrLegacyRole?.trim?.() ?? roleIdOrLegacyRole;
  if (id && USER_ROLES[id]) return id;
  return DEFAULT_ROLE_ID;
}

export function roleCanInvite(roleId) {
  return USER_ROLES[resolveRoleId(roleId)]?.canInvite === true;
}

export function roleCanManageUsers(roleId) {
  return USER_ROLES[resolveRoleId(roleId)]?.canManageUsers === true;
}

export function sortRoles(roles = DEFAULT_USER_ROLES) {
  return [...roles].sort((a, b) => a.sortOrder - b.sortOrder);
}
