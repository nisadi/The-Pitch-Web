"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { adminNavItems } from "./adminNav";
import { useAdminSidebar } from "./adminSidebarContext";
import AdminUserFooter from "./AdminUserFooter";
import styles from "./Admin.module.css";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { collapsed, closeMobileMenu } = useAdminSidebar();

  const isActive = (href, exact) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarMobileHeader}>
        <img
          src="/images/the-pitch-logo.png"
          alt="The Pitch Indoor Stadium"
          className={styles.brandLogoMobile}
        />
        <button
          type="button"
          className={styles.sidebarCloseBtn}
          onClick={closeMobileMenu}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <div className={styles.brand}>
        <img
          src="/images/the-pitch-logo.png"
          alt="The Pitch Indoor Stadium"
          className={styles.brandLogo}
        />
      </div>

      <nav className={styles.nav}>
        {adminNavItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={`${styles.navLink} ${isActive(href, exact) ? styles.navLinkActive : ""}`}
            onClick={closeMobileMenu}
          >
            <Icon size={18} />
            <span className={styles.navLabel}>{label}</span>
          </Link>
        ))}
      </nav>

      <AdminUserFooter />
    </aside>
  );
}
