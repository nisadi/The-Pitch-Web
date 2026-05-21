"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, MailPlus, X } from "lucide-react";
import emailjs from "@emailjs/browser";
import { formatEmailJsError } from "@/lib/email/formatEmailJsError";
import { DEFAULT_ROLE_ID } from "@/lib/users/userRoles";
import styles from "./InviteUserModal.module.css";

const EMPTY = {
  name: "",
  email: "",
  roleId: DEFAULT_ROLE_ID,
  password: "",
};

export default function InviteUserModal({
  open,
  roles = [],
  onClose,
  onInvite,
}) {
  const [form, setForm] = useState(EMPTY);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY);
      setPasswordVisible(false);
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const roleMeta = roles.find((role) => role.id === form.roleId);
  const canSubmit =
    form.name.trim() && form.email.trim() && form.password.length >= 8;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    const sent = await onInvite({
      name: form.name,
      email: form.email,
      roleId: form.roleId,
      password: form.password,
    });

    if (sent) {
      setSendingEmail(true);
      try {
        const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
        const templateId = process.env.NEXT_PUBLIC_EMAILJS_INVITE_TEMPLATE_ID;
        const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
          window.alert(
            "Invite email is not configured. Set NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_INVITE_TEMPLATE_ID, and NEXT_PUBLIC_EMAILJS_PUBLIC_KEY in .env.local."
          );
          return;
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
          window.location.origin;

        try {
          const result = await emailjs.send(
            serviceId,
            templateId,
            {
              name: form.name,
              email: form.email,
              password: form.password,
              loginUrl: `${baseUrl}/login`,
            },
            { publicKey }
          );

          if (result.status < 200 || result.status >= 300) {
            throw result;
          }
        } catch (err) {
          const message = formatEmailJsError(err);
          console.error("Invite email failed", {
            status: err?.status,
            text: err?.text,
            message,
          });
          window.alert(message);
          return;
        }
      } finally {
        setSendingEmail(false);
      }

      window.alert(`User ${form.email} was created successfully.`);
      onClose();
    }
  };

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-user-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2 id="invite-user-title">Add team member</h2>
            <p>Create an admin account with name, email, role, and password.</p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <form id="invite-user-form" className={styles.body} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="invite-name">
              User name
            </label>
            <input
              id="invite-name"
              className={styles.input}
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Nimal Perera"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="invite-email">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              className={styles.input}
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="name@thepitch.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="invite-role">
              Role
            </label>
            <select
              id="invite-role"
              className={styles.select}
              value={form.roleId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, roleId: e.target.value }))
              }
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
            {roleMeta && (
              <span className={styles.roleHint}>{roleMeta.description}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="invite-password">
              Password
            </label>
            <div className={styles.passwordWrap}>
              <input
                id="invite-password"
                type={passwordVisible ? "text" : "password"}
                className={styles.input}
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Minimum 8 characters"
                minLength={8}
                required
                autoComplete="new-password"
                spellCheck={false}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                title={passwordVisible ? "Hide password" : "Show password"}
              >
                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </form>

        <footer className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="invite-user-form"
            className={styles.inviteBtn}
            disabled={!canSubmit || sendingEmail}
          >
            <MailPlus size={16} />
            {sendingEmail ? "Sending email…" : "Create user"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
