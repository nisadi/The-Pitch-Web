export const ADMIN_PAGES = {
  "/admin/dashboard": { title: "Dashboard" },
  "/admin/bookings": { title: "Bookings" },
  "/admin/packages": { title: "Packages" },
  "/admin/customers": { title: "Customer" },
  "/admin/payments": { title: "Payment" },
  "/admin/users": { title: "Users" },
  "/admin/settings": { title: "Settings" },
};

export function getAdminPageMeta(pathname) {
  if (ADMIN_PAGES[pathname]) return ADMIN_PAGES[pathname];

  const match = Object.entries(ADMIN_PAGES).find(([path]) =>
    pathname.startsWith(`${path}/`)
  );

  if (match) return match[1];

  return { title: "Admin" };
}
