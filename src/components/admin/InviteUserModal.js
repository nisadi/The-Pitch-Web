"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MailPlus, X } from "lucide-react";
import { USER_ROLES } from "@/lib/users/usersDefaults";
import styles from "./InviteUserModal.module.css";

const EMPTY = {
  name: "",
  email: "",
  role: "staff",
  locations: [],
};

export default function InviteUserModal({
  open,
  locations,
  onClose,
  onInvite,
}) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY);
      return undefined;
    }

    setForm({
      ...EMPTY,
      locations: locations.map((loc) => loc.shortName),
    });

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
  }, [open, locations, onClose]);

  if (!open) return null;

  const roleMeta = USER_ROLES[form.role];

  const toggleLocation = (name) => {
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.includes(name)
        ? prev.locations.filter((loc) => loc !== name)
        : [...prev.locations, name],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    const sent = onInvite({
      name: form.name,
      email: form.email,
      role: form.role,
      locations: form.locations,
    });

    if (sent) {
      window.alert(
        `Invitation sent to ${form.email}. They will receive an email to set up their account.`
      );
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
            <h2 id="invite-user-title">Invite team member</h2>
            <p>
              Send an invite by email. Only admins can add new users to The
              Pitch admin.
            </p>
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
              Full name
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
              value={form.role}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, role: e.target.value }))
              }
            >
              {Object.entries(USER_ROLES).map(([id, role]) => (
                <option key={id} value={id}>
                  {role.label}
                </option>
              ))}
            </select>
            {roleMeta && (
              <span className={styles.roleHint}>{roleMeta.description}</span>
            )}
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Locations</span>
            <div className={styles.locations}>
              {locations.map((loc) => {
                const active = form.locations.includes(loc.shortName);
                return (
                  <label
                    key={loc.id}
                    className={`${styles.locationChip} ${active ? styles.locationChipActive : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleLocation(loc.shortName)}
                    />
                    {loc.shortName}
                  </label>
                );
              })}
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
            disabled={!form.name.trim() || !form.email.trim()}
          >
            <MailPlus size={16} />
            Send invite
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
