export const USERS_STORAGE_KEY = "the_pitch_admin_users_v1";

export const USER_ROLES = {
  admin: {
    label: "Admin",
    color: "#a855f7",
    description: "Full access. Can invite and manage all users.",
    canInvite: true,
    canManageUsers: true,
  },
  manager: {
    label: "Manager",
    color: "#3b82f6",
    description: "Manage bookings, customers, and day-to-day operations.",
    canInvite: false,
    canManageUsers: false,
  },
  staff: {
    label: "Staff",
    color: "#22c55e",
    description: "Front-desk access for bookings and check-ins.",
    canInvite: false,
    canManageUsers: false,
  },
};

export const USER_STATUSES = {
  active: { label: "Active", color: "#22c55e" },
  invited: { label: "Invited", color: "#eab308" },
  disabled: { label: "Disabled", color: "#6b7280" },
};

export const DEFAULT_TEAM_USERS = [
  {
    id: "usr-admin-001",
    name: "Admin User",
    email: "admin@thepitch.com",
    role: "admin",
    status: "active",
    locations: ["Maharagama", "Attidiya", "Moratuwa"],
    lastActive: "2026-05-18",
    invitedAt: "2024-01-01",
  },
  {
    id: "usr-manager-001",
    name: "Jane Fernando",
    email: "jane.manager@thepitch.com",
    role: "manager",
    status: "active",
    locations: ["Maharagama", "Attidiya"],
    lastActive: "2026-05-17",
    invitedAt: "2024-06-15",
  },
  {
    id: "usr-staff-001",
    name: "Kamal Silva",
    email: "kamal.staff@thepitch.com",
    role: "staff",
    status: "active",
    locations: ["Moratuwa"],
    lastActive: "2026-05-18",
    invitedAt: "2025-02-20",
  },
];

export function normalizeUser(user) {
  const role = USER_ROLES[user.role] ? user.role : "staff";
  const status = USER_STATUSES[user.status] ? user.status : "invited";

  return {
    id: user.id,
    name: user.name?.trim() ?? "",
    email: user.email?.trim().toLowerCase() ?? "",
    role,
    status,
    locations: Array.isArray(user.locations) ? user.locations : [],
    lastActive: user.lastActive ?? "",
    invitedAt: user.invitedAt ?? new Date().toISOString().slice(0, 10),
  };
}

export function slugifyUserId(email) {
  const local = email.split("@")[0] ?? "user";
  return `usr-${local.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;
}

export function roleCanInvite(role) {
  return USER_ROLES[role]?.canInvite === true;
}

export function roleCanManageUsers(role) {
  return USER_ROLES[role]?.canManageUsers === true;
}
