"use client";

import AdminSidebar from "./AdminSidebar";
import AdminSidebarToggle from "./AdminSidebarToggle";
import AdminTopBar from "./AdminTopBar";
import { AdminLocationProvider } from "./adminLocationContext";
import { AdminSettingsProvider } from "./settings/adminSettingsContext";
import { UsersProvider } from "@/lib/users/usersContext";
import { AdminSidebarProvider, useAdminSidebar } from "./adminSidebarContext";
import AdminAuthGate from "./AdminAuthGate";
import styles from "./Admin.module.css";

function AdminShellInner({ children }) {
  const { collapsed, mobileOpen, closeMobileMenu } = useAdminSidebar();

  return (
    <AdminAuthGate>
    <div
      className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ""} ${mobileOpen ? styles.shellMobileNavOpen : ""}`}
    >
      {mobileOpen && (
        <button
          type="button"
          className={styles.sidebarOverlay}
          onClick={closeMobileMenu}
          aria-label="Close menu"
        />
      )}
      <AdminSidebar />
      <AdminSidebarToggle />
      <main className={styles.main}>
        <AdminTopBar />
        <div className={styles.mainContent}>{children}</div>
      </main>
    </div>
    </AdminAuthGate>
  );
}

export default function AdminShell({ children }) {
  return (
    <AdminSettingsProvider>
      <UsersProvider>
        <AdminLocationProvider>
          <AdminSidebarProvider>
            <AdminShellInner>{children}</AdminShellInner>
          </AdminSidebarProvider>
        </AdminLocationProvider>
      </UsersProvider>
    </AdminSettingsProvider>
  );
}
