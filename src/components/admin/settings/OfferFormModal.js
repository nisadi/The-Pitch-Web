"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Info, Lightbulb, Save } from "lucide-react";
import { codeFromTitle } from "@/lib/promos/promoMapper";
import styles from "./LocationFormModal.module.css";

export default function OfferFormModal({
  open,
  mode = "create",
  form,
  locations = [],
  onChange,
  onClose,
  onSubmit,
}) {
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return undefined;

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

  const handleTitleChange = (title) => {
    const patch = { title };
    if (!isEdit || !form.code || form.code === codeFromTitle(form.title)) {
      patch.code = codeFromTitle(title);
    }
    onChange(patch);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  const activeLocations = locations.filter(
    (location) => location.status === "active"
  );

  const toggleLocation = (id) => {
    const next = form.locationIds.includes(id)
      ? form.locationIds.filter((locId) => locId !== id)
      : [...form.locationIds, id];
    onChange({ locationIds: next });
  };

  const canSave =
    form.title.trim() &&
    form.code.trim() &&
    form.discountValue !== "" &&
    !Number.isNaN(Number(form.discountValue)) &&
    Number(form.discountValue) > 0 &&
    form.locationIds.length > 0 &&
    form.startsAt &&
    form.endsAt;

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
        aria-labelledby="offer-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <ArrowLeft size={20} />
          </button>
          <div className={styles.headerText}>
            <h2 id="offer-modal-title">
              {isEdit ? "Edit offer" : "Add offer"}
            </h2>
            <p>
              {isEdit
                ? "Update promotion details, discount, venues, and validity."
                : "Create a promo code customers can apply at checkout."}
            </p>
          </div>
        </header>

        <form
          id="offer-modal-form"
          className={styles.body}
          onSubmit={handleSubmit}
        >
          <div className={styles.infoBanner}>
            <Info size={18} />
            <span>
              Promo codes sync to Supabase in real time. The code is what
              customers enter at checkout (e.g. FIRSTGAME).
            </span>
          </div>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Offer details</h3>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="offer-modal-title-field">
                Offer title <span className={styles.required}>*</span>
              </label>
              <input
                id="offer-modal-title-field"
                className={styles.input}
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Weekend Morning Special"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="offer-modal-code">
                Promo code <span className={styles.required}>*</span>
              </label>
              <p className={styles.hint}>
                Unique code for checkout. Auto-filled from the title; edit if
                needed.
              </p>
              <input
                id="offer-modal-code"
                className={styles.input}
                value={form.code}
                onChange={(e) =>
                  onChange({ code: e.target.value.toUpperCase() })
                }
                placeholder="WEEKEND20"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="offer-modal-desc">
                Description
              </label>
              <textarea
                id="offer-modal-desc"
                className={styles.textarea}
                value={form.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="20% off all slots before 12:00 on Saturday and Sunday."
              />
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Discount</h3>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="offer-modal-type">
                  Discount type <span className={styles.required}>*</span>
                </label>
                <select
                  id="offer-modal-type"
                  className={styles.select}
                  value={form.discountType}
                  onChange={(e) => onChange({ discountType: e.target.value })}
                >
                  <option value="percent">Percentage</option>
                  <option value="fixed">Fixed amount (LKR)</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="offer-modal-value">
                  Value <span className={styles.required}>*</span>
                </label>
                <input
                  id="offer-modal-value"
                  type="number"
                  min="0"
                  className={styles.input}
                  value={form.discountValue}
                  onChange={(e) => onChange({ discountValue: e.target.value })}
                  placeholder={form.discountType === "percent" ? "20" : "1500"}
                  required
                />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Validity & venues</h3>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="offer-modal-start">
                  Valid from <span className={styles.required}>*</span>
                </label>
                <input
                  id="offer-modal-start"
                  type="date"
                  className={styles.input}
                  value={form.startsAt}
                  onChange={(e) => onChange({ startsAt: e.target.value })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="offer-modal-end">
                  Valid until <span className={styles.required}>*</span>
                </label>
                <input
                  id="offer-modal-end"
                  type="date"
                  className={styles.input}
                  value={form.endsAt}
                  onChange={(e) => onChange({ endsAt: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="offer-modal-status">
                Status
              </label>
              <select
                id="offer-modal-status"
                className={styles.select}
                value={form.status}
                onChange={(e) => onChange({ status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>
                Locations <span className={styles.required}>*</span>
              </span>
              <p className={styles.hint}>
                Select venues where this promo can be used.
              </p>
              {activeLocations.length === 0 ? (
                <p className={styles.emptySports}>
                  No active locations. Add locations under Settings →
                  Locations first.
                </p>
              ) : (
                <div className={styles.sportGrid}>
                  {activeLocations.map((location) => {
                    const checked = form.locationIds.includes(location.id);
                    return (
                      <label
                        key={location.id}
                        className={`${styles.sportOption} ${checked ? styles.sportOptionChecked : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleLocation(location.id)}
                        />
                        <span className={styles.sportOptionText}>
                          <span className={styles.sportOptionName}>
                            {location.shortName || location.name}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <div className={styles.tips}>
            <Lightbulb size={18} />
            <div>
              <p className={styles.tipsTitle}>Tips</p>
              <p>
                Inactive offers are hidden from checkout. Keep promo codes unique
                — they are stored in the database and sync live across admin
                sessions.
              </p>
            </div>
          </div>
        </form>

        <footer className={styles.footer}>
          <button
            type="submit"
            className={styles.saveBtn}
            form="offer-modal-form"
            disabled={!canSave}
          >
            <Save size={18} />
            {isEdit ? "Save changes" : "Save offer"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
