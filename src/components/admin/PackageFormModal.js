"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  buildPackageFromTemplate,
  getTemplateById,
} from "@/lib/packages/packagesDefaults";
import styles from "./PackageFormModal.module.css";

export default function PackageFormModal({
  open,
  template,
  initialPackage,
  locations,
  sports,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!open) {
      setForm(null);
      return undefined;
    }

    if (initialPackage) {
      setForm({
        ...initialPackage,
        price: String(initialPackage.price),
        features: initialPackage.features.join("\n"),
        details: { ...initialPackage.details },
      });
    } else if (template) {
      setForm({
        ...buildPackageFromTemplate(template),
        features: template.suggestedFeatures.join("\n"),
      });
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
  }, [open, template, initialPackage, onClose]);

  if (!open || !form) return null;

  const activeTemplate =
    getTemplateById(form.templateId) ?? template ?? null;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setDetail = (key, value) => {
    setForm((prev) => ({
      ...prev,
      details: { ...prev.details, [key]: value },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const features = form.features
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!form.name.trim() || !form.location || !form.price || features.length === 0) {
      return;
    }

    const details = {};
    activeTemplate?.fields.forEach((field) => {
      const raw = form.details[field.key];
      details[field.key] =
        field.type === "number" ? Number(raw) || 0 : String(raw ?? "");
    });

    onSave({
      ...form,
      name: form.name.trim(),
      shortDescription: form.shortDescription.trim(),
      price: Number(form.price),
      features,
      details,
    });
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
        aria-labelledby="package-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2 id="package-form-title">
              {initialPackage ? "Edit package" : "Add package"}
            </h2>
            <p>
              {activeTemplate
                ? `Template: ${activeTemplate.name}`
                : "Configure package details for the website."}
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

        <form
          id="package-form"
          className={styles.body}
          onSubmit={handleSubmit}
        >
          <div className={styles.grid}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label} htmlFor="pkg-name">
                Package name
              </label>
              <input
                id="pkg-name"
                className={styles.input}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Maharagama Monthly"
                required
              />
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label} htmlFor="pkg-desc">
                Short description
              </label>
              <textarea
                id="pkg-desc"
                className={styles.textarea}
                value={form.shortDescription}
                onChange={(e) => setField("shortDescription", e.target.value)}
                rows={2}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pkg-location">
                Location
              </label>
              <select
                id="pkg-location"
                className={styles.select}
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                required
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.shortName}>
                    {loc.shortName}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pkg-sport">
                Sport
              </label>
              <select
                id="pkg-sport"
                className={styles.select}
                value={form.sport}
                onChange={(e) => setField("sport", e.target.value)}
              >
                <option value="All sports">All sports</option>
                {sports
                  .filter((s) => s.status === "active")
                  .map((sport) => (
                    <option key={sport.id} value={sport.name}>
                      {sport.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pkg-price">
                Price (LKR)
              </label>
              <input
                id="pkg-price"
                type="number"
                min="0"
                className={styles.input}
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                required
              />
              <span className={styles.hint}>{form.priceLabel}</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pkg-status">
                Status
              </label>
              <select
                id="pkg-status"
                className={styles.select}
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {activeTemplate?.fields.map((field) => (
              <div key={field.key} className={styles.field}>
                <label className={styles.label} htmlFor={`pkg-${field.key}`}>
                  {field.label}
                </label>
                <input
                  id={`pkg-${field.key}`}
                  type={field.type}
                  className={styles.input}
                  value={form.details[field.key] ?? ""}
                  onChange={(e) => setDetail(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              </div>
            ))}

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label} htmlFor="pkg-features">
                Features (one per line)
              </label>
              <textarea
                id="pkg-features"
                className={styles.textarea}
                value={form.features}
                onChange={(e) => setField("features", e.target.value)}
                rows={4}
                required
              />
            </div>

            <p className={`${styles.sectionTitle} ${styles.fieldFull}`}>
              Call to action
            </p>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pkg-cta-label">
                Button label
              </label>
              <input
                id="pkg-cta-label"
                className={styles.input}
                value={form.ctaLabel}
                onChange={(e) => setField("ctaLabel", e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pkg-cta-href">
                Button link
              </label>
              <input
                id="pkg-cta-href"
                className={styles.input}
                value={form.ctaHref}
                onChange={(e) => setField("ctaHref", e.target.value)}
                placeholder="/booking"
              />
            </div>

            <label className={`${styles.checkRow} ${styles.fieldFull}`}>
              <input
                type="checkbox"
                checked={form.highlighted}
                onChange={(e) => setField("highlighted", e.target.checked)}
              />
              Highlight on memberships page (featured)
            </label>
          </div>
        </form>

        <footer className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="package-form" className={styles.saveBtn}>
            {initialPackage ? "Save changes" : "Add package"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}


