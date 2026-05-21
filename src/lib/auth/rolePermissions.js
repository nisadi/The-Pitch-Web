import { resolveRoleId } from "@/lib/users/userRoles";

/**
 * Predefined admin areas per role (sync with role descriptions in userRoles.js).
 */
export const ROLE_ACCESS = {
  admin: {
    dashboard: true,
    bookings: true,
    packages: true,
    customers: true,
    payments: true,
    users: true,
    settings: true,
  },
  manager: {
    dashboard: true,
    bookings: true,
    packages: true,
    customers: true,
    payments: true,
    users: false,
    settings: false,
  },
  staff: {
    dashboard: true,
    bookings: true,
    packages: false,
    customers: true,
    payments: false,
    users: false,
    settings: false,
  },
};

export function getRoleAccess(roleId) {
  const id = resolveRoleId(roleId);
  return ROLE_ACCESS[id] ?? ROLE_ACCESS.staff;
}

export function roleHasPermission(roleId, permission) {
  return getRoleAccess(roleId)[permission] === true;
}
