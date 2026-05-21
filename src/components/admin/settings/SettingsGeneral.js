"use client";

import { useEffect, useState } from "react";
import { useAdminSettings } from "./adminSettingsContext";
import styles from "./AdminSettings.module.css";

export default function SettingsGeneral() {
  const { general, updateGeneral, resetSettings } = useAdminSettings();
  const [form, setForm] = useState(general);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(general);
  }, [general]);

  const handleChange = (field) => (event) => {
    const value =
      event.target.type === "number"
        ? Number(event.target.value)
        : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateGeneral(form);
    setSaved(true);
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Reset all admin settings to defaults? Locations, sports, and offers will be restored."
      )
    ) {
      resetSettings();
      setSaved(false);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3>General</h3>
          <p>Business profile, support contacts, and default booking rules.</p>
        </div>
      </div>

      <form className={styles.form} style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label} htmlFor="gen-name">
              Business name
            </label>
            <input
              id="gen-name"
              className={styles.input}
              value={form.businessName}
              onChange={handleChange("businessName")}
              required
            />
          </div>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label} htmlFor="gen-tagline">
              Tagline
            </label>
            <input
              id="gen-tagline"
              className={styles.input}
              value={form.tagline}
              onChange={handleChange("tagline")}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="gen-email">
              Support email
            </label>
            <input
              id="gen-email"
              type="email"
              className={styles.input}
              value={form.supportEmail}
              onChange={handleChange("supportEmail")}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="gen-phone">
              Support phone
            </label>
            <input
              id="gen-phone"
              className={styles.input}
              value={form.supportPhone}
              onChange={handleChange("supportPhone")}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="gen-currency">
              Currency
            </label>
            <input
              id="gen-currency"
              className={styles.input}
              value={form.currency}
              onChange={handleChange("currency")}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="gen-slot">
              Default slot (minutes)
            </label>
            <input
              id="gen-slot"
              type="number"
              min="15"
              step="15"
              className={styles.input}
              value={form.defaultSlotMinutes}
              onChange={handleChange("defaultSlotMinutes")}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="gen-lead">
              Minimum booking lead time (hours)
            </label>
            <input
              id="gen-lead"
              type="number"
              min="0"
              className={styles.input}
              value={form.bookingLeadTimeHours}
              onChange={handleChange("bookingLeadTimeHours")}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="gen-cancel">
              Cancellation window (hours)
            </label>
            <input
              id="gen-cancel"
              type="number"
              min="0"
              className={styles.input}
              value={form.cancellationHours}
              onChange={handleChange("cancellationHours")}
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryBtn}>
            Save general settings
          </button>
          {saved && (
            <span className={styles.cardMeta} style={{ alignSelf: "center" }}>
              Saved
            </span>
          )}
          <button type="button" className={styles.dangerBtn} onClick={handleReset}>
            Reset all settings
          </button>
        </div>
      </form>
    </section>
  );
}
