"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminSidebar } from "./adminSidebarContext";
import styles from "./Admin.module.css";

export default function AdminSidebarToggle() {
  const { collapsed, toggle } = useAdminSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      className={styles.sidebarToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
    >
      {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
    </button>
  );
}
