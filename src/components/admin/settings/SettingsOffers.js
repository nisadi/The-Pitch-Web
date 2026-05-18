"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { slugifyId } from "./adminSettingsDefaults";
import { useAdminSettings } from "./adminSettingsContext";
import styles from "./AdminSettings.module.css";

const EMPTY = {
  title: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  locationIds: [],
  startsAt: "",
  endsAt: "",
  status: "active",
};

function formatDiscount(offer) {
  if (offer.discountType === "percent") {
    return `${offer.discountValue}% off`;
  }
  return `LKR ${Number(offer.discountValue).toLocaleString("en-LK")} off`;
}

export default function SettingsOffers() {
  const { offers, locations, addOffer, updateOffer, removeOffer } =
    useAdminSettings();
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const startCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY,
      locationIds: locations.filter((l) => l.status === "active").map((l) => l.id),
    });
    setShowForm(true);
  };

  const startEdit = (offer) => {
    setEditingId(offer.id);
    setForm({
      title: offer.title,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: String(offer.discountValue),
      locationIds: offer.locationIds,
      startsAt: offer.startsAt,
      endsAt: offer.endsAt,
      status: offer.status,
    });
    setShowForm(true);
  };

  const toggleLocation = (id) => {
    setForm((prev) => ({
      ...prev,
      locationIds: prev.locationIds.includes(id)
        ? prev.locationIds.filter((locId) => locId !== id)
        : [...prev.locationIds, id],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      discountValue: Number(form.discountValue),
      locationIds: form.locationIds,
    };

    if (!payload.title || !payload.discountValue || payload.locationIds.length === 0) {
      return;
    }

    if (editingId) {
      updateOffer(editingId, payload);
    } else {
      const id = slugifyId(payload.title);
      if (offers.some((offer) => offer.id === id)) {
        window.alert("An offer with this title already exists.");
        return;
      }
      addOffer({ ...payload, id });
    }

    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
  };

  const handleDelete = (offer) => {
    if (window.confirm(`Remove offer "${offer.title}"?`)) {
      removeOffer(offer.id);
      if (editingId === offer.id) {
        setShowForm(false);
        setEditingId(null);
      }
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3>Offers & promotions</h3>
          <p>Create discounts and bundles applied during checkout or booking.</p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={startCreate}>
          <Plus size={16} />
          Add offer
        </button>
      </div>

      {offers.length === 0 ? (
        <p className={styles.empty}>No offers yet. Create promotions for specific venues or seasons.</p>
      ) : (
        <div className={styles.list}>
          {offers.map((offer) => (
            <article key={offer.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardTitle}>{offer.title}</div>
                  <p className={styles.cardMeta}>{offer.description}</p>
                  <p className={styles.cardMeta}>
                    {formatDiscount(offer)} · {offer.startsAt} → {offer.endsAt}
                  </p>
                  <div className={styles.tagList}>
                    {offer.locationIds.map((locId) => {
                      const loc = locations.find((item) => item.id === locId);
                      return (
                        <span key={locId} className={styles.tag}>
                          {loc?.shortName ?? locId}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <span
                    className={`${styles.badge} ${
                      offer.status === "active"
                        ? styles.badgeActive
                        : styles.badgeInactive
                    }`}
                  >
                    {offer.status}
                  </span>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => startEdit(offer)}
                    aria-label={`Edit ${offer.title}`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => handleDelete(offer)}
                    aria-label={`Delete ${offer.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label} htmlFor="offer-title">
                Offer title
              </label>
              <input
                id="offer-title"
                className={styles.input}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label} htmlFor="offer-desc">
                Description
              </label>
              <textarea
                id="offer-desc"
                className={styles.textarea}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="offer-type">
                Discount type
              </label>
              <select
                id="offer-type"
                className={styles.select}
                value={form.discountType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountType: e.target.value }))
                }
              >
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed amount (LKR)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="offer-value">
                Value
              </label>
              <input
                id="offer-value"
                type="number"
                min="0"
                className={styles.input}
                value={form.discountValue}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountValue: e.target.value }))
                }
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="offer-start">
                Starts
              </label>
              <input
                id="offer-start"
                type="date"
                className={styles.input}
                value={form.startsAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startsAt: e.target.value }))
                }
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="offer-end">
                Ends
              </label>
              <input
                id="offer-end"
                type="date"
                className={styles.input}
                value={form.endsAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endsAt: e.target.value }))
                }
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="offer-status">
                Status
              </label>
              <select
                id="offer-status"
                className={styles.select}
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.label}>Locations</span>
              <div className={styles.checkboxGroup}>
                {locations.map((location) => (
                  <label key={location.id} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={form.locationIds.includes(location.id)}
                      onChange={() => toggleLocation(location.id)}
                    />
                    {location.shortName}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn}>
              {editingId ? "Save changes" : "Create offer"}
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
