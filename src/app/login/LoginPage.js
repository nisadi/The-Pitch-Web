"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { loginRoleUser } from "@/lib/auth/loginRoleUser";
import {
  canAccessAdminPath,
  getDefaultAdminRoute,
} from "@/components/admin/adminNav";
import { setAdminSession } from "@/components/admin/adminSession";
import { USER_ROLES } from "@/lib/users/userRoles";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    searchParams.get("error") === "disabled"
      ? "Your account has been disabled. Contact an administrator."
      : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginRoleUser(email, password);
      setAdminSession(user);

      const next = searchParams.get("next");
      let destination = getDefaultAdminRoute(user.roleId);
      if (
        next &&
        next.startsWith("/admin") &&
        canAccessAdminPath(user.roleId, next)
      ) {
        destination = next;
      }

      router.replace(destination);
    } catch (err) {
      setError(err?.message ?? "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img
          src="/images/the-pitch-logo.png"
          alt="The Pitch Indoor Stadium"
          className={styles.logo}
        />
        <h1>Admin sign in</h1>
        <p className={styles.subtitle}>
          Sign in with your team account. Your role controls which areas you
          can access.
        </p>

        <ul className={styles.roleList}>
          {Object.values(USER_ROLES).map((role) => (
            <li key={role.id}>
              <strong style={{ color: role.color }}>{role.label}</strong>
              <span>{role.description}</span>
            </li>
          ))}
        </ul>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}

          <label className={styles.label} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@thepitch.com"
            required
            autoComplete="email"
          />

          <label className={styles.label} htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            autoComplete="current-password"
          />

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            <LogIn size={18} />
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className={styles.hint}>
          Demo: admin@thepitch.com / changeme (if using seed data)
        </p>
      </div>
    </div>
  );
}
