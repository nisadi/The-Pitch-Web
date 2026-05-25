"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { cardRoleHasField } from "@/lib/events/eventCardFields";
import { EVENT_CARD_FALLBACKS } from "@/lib/events/eventCardsDefaults";
import styles from "./settings/LocationFormModal.module.css";

const SECTION_LABELS = {
  corporate: "Corporate",
  school: "School",
};

const ROLE_LABELS = {
  packages: "Packages card",
  entry: "Entry / pricing card",
  programs: "Programs card",
  excellence: "Excellence card",
};

function emptyTier() {
  return { label: "", sublabel: "", price: "", priceSuffix: "" };
}

export default function EventCardFormModal({
  open,
  cardKey,
  form,
  onChange,
  onClose,
  onSubmit,
  saving = false,
}) {
  const fallback = EVENT_CARD_FALLBACKS[cardKey];
  const cardRole = form?.cardRole ?? fallback?.cardRole ?? "packages";
  const section = form?.section ?? fallback?.section ?? "corporate";

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

  if (!open || !form) return null;

  const setTier = (index, patch) => {
    const next = [...(form.priceTiers ?? [])];
    next[index] = { ...next[index], ...patch };
    onChange({ priceTiers: next });
  };

  const addTier = () => {
    onChange({ priceTiers: [...(form.priceTiers ?? []), emptyTier()] });
  };

  const removeTier = (index) => {
    onChange({
      priceTiers: (form.priceTiers ?? []).filter((_, i) => i !== index),
    });
  };

  const canSave = Boolean(form.title?.trim());

  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-card-modal-title"
        onClick={(e) => e.stopPropagation()}
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
            <h2 id="event-card-modal-title">Edit {form.title || "event card"}</h2>
            <p>
              {SECTION_LABELS[section] ?? section} ·{" "}
              {ROLE_LABELS[cardRole] ?? cardRole}. Changes sync to the public
              /events page in real time.
            </p>
          </div>
        </header>

        <form
          id="event-card-form"
          className={styles.body}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Card identity</h3>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label}>Section</label>
                <input
                  className={styles.input}
                  value={SECTION_LABELS[section] ?? section}
                  readOnly
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Card role</label>
                <input
                  className={styles.input}
                  value={ROLE_LABELS[cardRole] ?? cardRole}
                  readOnly
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="event-card-slug">
                Slug
              </label>
              <input
                id="event-card-slug"
                className={styles.input}
                value={form.slug ?? ""}
                onChange={(e) => onChange({ slug: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="event-card-title">
                Title <span className={styles.required}>*</span>
              </label>
              <input
                id="event-card-title"
                className={styles.input}
                value={form.title ?? ""}
                onChange={(e) => onChange({ title: e.target.value })}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="event-card-desc">
                Description
              </label>
              <textarea
                id="event-card-desc"
                className={styles.textarea}
                value={form.description ?? ""}
                onChange={(e) => onChange({ description: e.target.value })}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="event-card-category">
                  Category
                </label>
                <input
                  id="event-card-category"
                  className={styles.input}
                  value={form.category ?? ""}
                  onChange={(e) => onChange({ category: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="event-card-sort">
                  Sort order
                </label>
                <input
                  id="event-card-sort"
                  type="number"
                  className={styles.input}
                  value={form.sortOrder ?? 0}
                  onChange={(e) =>
                    onChange({ sortOrder: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="event-card-price">
                  Base price (optional)
                </label>
                <input
                  id="event-card-price"
                  type="number"
                  min="0"
                  className={styles.input}
                  value={form.price ?? ""}
                  onChange={(e) => onChange({ price: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="event-card-active">
                  Visible on website
                </label>
                <select
                  id="event-card-active"
                  className={styles.select}
                  value={form.isActive === false ? "inactive" : "active"}
                  onChange={(e) =>
                    onChange({ isActive: e.target.value === "active" })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Hidden</option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="event-card-image">
                Image URL
              </label>
              <input
                id="event-card-image"
                className={styles.input}
                value={form.imageUrl ?? ""}
                onChange={(e) => onChange({ imageUrl: e.target.value })}
                placeholder="https://…"
              />
            </div>
          </section>

          {cardRoleHasField(cardRole, "badges") && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Badges</h3>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="event-card-badges">
                  Badge labels (one per line)
                </label>
                <textarea
                  id="event-card-badges"
                  className={styles.textarea}
                  value={form.badgesText ?? ""}
                  onChange={(e) => onChange({ badgesText: e.target.value })}
                  placeholder="Team Building&#10;Executive Retreats"
                />
              </div>
            </section>
          )}

          {cardRoleHasField(cardRole, "priceTiers") && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Price tiers</h3>
              {(form.priceTiers ?? []).map((tier, index) => (
                <div key={index} className={styles.field} style={{ marginBottom: "1rem" }}>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Label</label>
                      <input
                        className={styles.input}
                        value={tier.label ?? ""}
                        onChange={(e) =>
                          setTier(index, { label: e.target.value })
                        }
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Sublabel</label>
                      <input
                        className={styles.input}
                        value={tier.sublabel ?? ""}
                        onChange={(e) =>
                          setTier(index, { sublabel: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Price</label>
                      <input
                        type="number"
                        min="0"
                        className={styles.input}
                        value={tier.price ?? ""}
                        onChange={(e) =>
                          setTier(index, { price: e.target.value })
                        }
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Suffix</label>
                      <input
                        className={styles.input}
                        value={tier.priceSuffix ?? ""}
                        onChange={(e) =>
                          setTier(index, { priceSuffix: e.target.value })
                        }
                        placeholder="/pp or /hr"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.textLink}
                    onClick={() => removeTier(index)}
                  >
                    <Trash2 size={14} /> Remove tier
                  </button>
                </div>
              ))}
              <button type="button" className={styles.textLink} onClick={addTier}>
                <Plus size={14} /> Add price tier
              </button>
            </section>
          )}

          {cardRoleHasField(cardRole, "highlightTags") && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Highlight tags</h3>
              <div className={styles.field}>
                <label className={styles.label}>Tags (one per line)</label>
                <textarea
                  className={styles.textarea}
                  value={form.highlightTagsText ?? ""}
                  onChange={(e) =>
                    onChange({ highlightTagsText: e.target.value })
                  }
                  placeholder="Carnivals&#10;Weekly PE"
                />
              </div>
            </section>
          )}

          {cardRoleHasField(cardRole, "footerBadge") && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Footer badge</h3>
              <div className={styles.field}>
                <input
                  className={styles.input}
                  value={form.footerBadge ?? ""}
                  onChange={(e) => onChange({ footerBadge: e.target.value })}
                  placeholder="Certified Safe & Insured Facility"
                />
              </div>
            </section>
          )}

          {cardRoleHasField(cardRole, "ctaLabel") && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Call to action</h3>
              <div className={styles.field}>
                <label className={styles.label}>Button label</label>
                <input
                  className={styles.input}
                  value={form.ctaLabel ?? ""}
                  onChange={(e) => onChange({ ctaLabel: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Link URL</label>
                <input
                  className={styles.input}
                  value={form.ctaHref ?? ""}
                  onChange={(e) => onChange({ ctaHref: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Brochure PDF URL</label>
                <input
                  className={styles.input}
                  value={form.brochureUrl ?? ""}
                  onChange={(e) => onChange({ brochureUrl: e.target.value })}
                />
              </div>
            </section>
          )}
        </form>

        <footer className={styles.footer}>
          <button
            type="submit"
            className={styles.saveBtn}
            form="event-card-form"
            disabled={!canSave || saving}
          >
            <Save size={18} />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
