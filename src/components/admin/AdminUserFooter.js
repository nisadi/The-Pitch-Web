"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { clearAdminSession, getAdminUser } from "./adminSession";
import { USER_ROLES } from "@/lib/users/usersDefaults";
import { useAdminSidebar } from "./adminSidebarContext";
import styles from "./Admin.module.css";

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminUserFooter() {
  const router = useRouter();
  const { collapsed, closeMobileMenu } = useAdminSidebar();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getAdminUser());
  }, []);

  const handleLogout = () => {
    closeMobileMenu();
    clearAdminSession();
    router.push("/login");
  };

  if (!user) {
    return <div className={styles.sidebarFooter} />;
  }

  return (
    <div className={styles.sidebarFooter}>
      <Link
        href="/profile"
        className={styles.userCard}
        title={collapsed ? user.name : undefined}
        onClick={closeMobileMenu}
      >
        <div className={styles.avatar}>{getInitials(user.name)}</div>
        <div className={styles.userInfo}>
          <strong>{user.name}</strong>
          <span>
            {USER_ROLES[user.role]?.label ?? user.role} · {user.email}
          </span>
        </div>
      </Link>

      <div className={styles.userActions}>
        <button
          type="button"
          onClick={handleLogout}
          className={styles.logoutBtn}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={18} />
          <span className={styles.logoutLabel}>Logout</span>
        </button>
      </div>
    </div>
  );
}
