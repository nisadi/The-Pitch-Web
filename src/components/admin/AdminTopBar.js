"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import AdminLocationSelect from "./AdminLocationSelect";
import { getAdminPageMeta } from "./adminPageMeta";
import { useAdminSidebar } from "./adminSidebarContext";
import styles from "./Admin.module.css";

export default function AdminTopBar() {
  const pathname = usePathname();
  const { title } = getAdminPageMeta(pathname);
  const { toggleMobileMenu } = useAdminSidebar();

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarLeft}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={toggleMobileMenu}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className={styles.topBarPage}>
          <span className={styles.breadcrumb}>Admin / {title}</span>
          <h1 className={styles.topBarTitle}>{title}</h1>
        </div>
      </div>
      <div className={styles.topBarRight}>
        <AdminLocationSelect />
      </div>
    </header>
  );
}
