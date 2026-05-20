"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  canAccessAdminPath,
  getDefaultAdminRoute,
} from "./adminNav";
import { getAdminUser } from "./adminSession";
import styles from "./Admin.module.css";

export default function AdminAuthGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = getAdminUser();

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.status === "disabled") {
      router.replace("/login?error=disabled");
      return;
    }

    if (!canAccessAdminPath(user.roleId ?? user.role, pathname)) {
      router.replace(getDefaultAdminRoute(user.roleId ?? user.role));
      return;
    }

    setAllowed(true);
  }, [pathname, router]);

  if (!allowed) {
    return (
      <div className={styles.authLoading}>
        <p>Checking access…</p>
      </div>
    );
  }

  return children;
}
