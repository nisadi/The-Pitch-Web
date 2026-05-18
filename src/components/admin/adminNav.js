import {
  LayoutDashboard,
  CalendarDays,
  Package,
  Users,
  UserCircle,
  CreditCard,
  Settings,
} from "lucide-react";

export const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/packages", label: "Packages", icon: Package },
  { href: "/admin/customers", label: "Customer", icon: UserCircle },
  { href: "/admin/payments", label: "Payment", icon: CreditCard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
