"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import OfferFormModal from "./OfferFormModal";
import { slugifyId } from "./adminSettingsDefaults";
import { useAdminSettings } from "./adminSettingsContext";
import styles from "./AdminSettings.module.css";

const EMPTY = {
  title: "",
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  locationIds: [],
  startsAt: "",
  endsAt: "",
  status: "active",
};

function offerToForm(offer) {
  return {
    title: offer.title ?? "",
    code: offer.code ?? "",
    description: offer.description ?? "",
    discountType: offer.discountType ?? "percent",
    discountValue: String(offer.discountValue ?? ""),
    locationIds: Array.isArray(offer.locationIds) ? [...offer.locationIds] : [],
    startsAt: offer.startsAt ?? "",
    endsAt: offer.endsAt ?? "",
    status: offer.status ?? "active",
  };
}

function formatDiscount(offer) {
  if (offer.discountType === "percent") {
    return `${offer.discountValue}% off`;
  }
  return `LKR ${Number(offer.discountValue).toLocaleString("en-LK")} off`;
}

export default function SettingsOffers() {
  const {
    ready,
    syncError,
    offers,
    locations,
    addOffer,
    updateOffer,
    removeOffer,
  } = useAdminSettings();
  const [editingId, setEditingId] = useState(null);
  const [editingDbId, setEditingDbId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const handleChange = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setEditingDbId(null);
    setForm(EMPTY);
  };

  const startCreate = () => {
    setEditingId(null);
    setEditingDbId(null);
    setForm({
      ...EMPTY,
      locationIds: locations
        .filter((location) => location.status === "active")
        .map((location) => location.id),
    });
    setModalOpen(true);
  };

  const startEdit = (offer) => {
    setEditingId(offer.id);
    setEditingDbId(offer.dbId ?? null);
    setForm(offerToForm(offer));
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      title: form.title.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      locationIds: form.locationIds,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      status: form.status,
    };

    if (
      !payload.title ||
      !payload.code ||
      !payload.discountValue ||
      payload.locationIds.length === 0 ||
      !payload.startsAt ||
      !payload.endsAt
    ) {
      window.alert("Please fill in all required fields.");
      return;
    }

    try {
      if (editingId) {
        await updateOffer(editingId, payload);
      } else {
        const id = slugifyId(payload.code);
        const codeTaken = offers.some(
          (offer) =>
            offer.code?.toUpperCase() === payload.code ||
            offer.id === id
        );
        if (codeTaken) {
          window.alert("An offer with this promo code already exists.");
          return;
        }
        await addOffer({ ...payload, id });
      }

      closeModal();
    } catch (err) {
      window.alert(err?.message ?? "Could not save offer.");
    }
  };

  const requestDelete = (offer) => {
    setDeleteTarget(offer);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await removeOffer(deleteTarget.id);
      if (editingId === deleteTarget.id) {
        closeModal();
      }
      setDeleteTarget(null);
    } catch (err) {
      window.alert(err?.message ?? "Could not delete offer.");
    }
  };

  return (
    <>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Offers & promotions</h3>
            <p>
              {!ready
                ? "Loading from Supabase…"
                : "Create discounts and promo codes applied during checkout or booking."}
            </p>
            {syncError && <p className={styles.syncError}>{syncError}</p>}
          </div>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={startCreate}
          >
            <Plus size={16} />
            Add offer
          </button>
        </div>

        {!ready ? (
          <p className={styles.empty}>Syncing with Supabase…</p>
        ) : offers.length === 0 ? (
          <p className={styles.empty}>
            No offers yet. Create promotions for specific venues or seasons.
          </p>
        ) : (
          <div className={styles.list}>
            {offers.map((offer) => (
              <article key={offer.dbId ?? offer.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.cardTitle}>{offer.title}</div>
                    <p className={styles.cardMeta}>
                      <strong>{offer.code}</strong>
                      {offer.description ? ` · ${offer.description}` : ""}
                    </p>
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
                      onClick={() => requestDelete(offer)}
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
      </section>

      <OfferFormModal
        open={modalOpen}
        mode={editingId ? "edit" : "create"}
        form={form}
        locations={locations}
        onChange={handleChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete offer?"
        description={`This will permanently remove "${deleteTarget?.title}" (${deleteTarget?.code}) from promo codes.`}
        confirmButtonLabel="Delete offer"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
