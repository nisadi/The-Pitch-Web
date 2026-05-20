import {
  LayoutDashboard,
  CalendarDays,
  Package,
  Users,
  UserCircle,
  CreditCard,
  Settings,
} from "lucide-react";
import { resolveRoleId } from "@/lib/users/userRoles";
import { getRoleAccess } from "@/lib/auth/rolePermissions";

/** Nav items with permission keys — filtered per role at runtime */
export const adminNavItems = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
    permission: "dashboard",
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    icon: CalendarDays,
    permission: "bookings",
  },
  {
    href: "/admin/packages",
    label: "Packages",
    icon: Package,
    permission: "packages",
  },
  {
    href: "/admin/customers",
    label: "Customer",
    icon: UserCircle,
    permission: "customers",
  },
  {
    href: "/admin/payments",
    label: "Payment",
    icon: CreditCard,
    permission: "payments",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    permission: "users",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    permission: "settings",
  },
];

export function getNavItemsForRole(roleId) {
  const access = getRoleAccess(roleId);
  return adminNavItems.filter((item) => access[item.permission]);
}

export function canAccessAdminPath(roleId, pathname) {
  const id = resolveRoleId(roleId);
  const access = getRoleAccess(id);

  return adminNavItems.some((item) => {
    if (!access[item.permission]) return false;

    if (item.exact) {
      return pathname === item.href;
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });
}

export function getDefaultAdminRoute(roleId) {
  const items = getNavItemsForRole(roleId);
  return items[0]?.href ?? "/admin/dashboard";
}
