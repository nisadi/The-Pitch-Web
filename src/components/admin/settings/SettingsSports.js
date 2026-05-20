"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import SportFormModal from "./SportFormModal";
import { slugifyId } from "./adminSettingsDefaults";
import { useAdminSettings } from "./adminSettingsContext";
import styles from "./AdminSettings.module.css";

const EMPTY = {
  name: "",
  slug: "",
  icon: "",
  image: "",
  description: "",
  status: "active",
};

function sportToForm(sport) {
  return {
    name: sport.name ?? "",
    slug: sport.slug ?? "",
    icon: sport.icon ?? "",
    image: sport.image ?? "",
    description: sport.description ?? "",
    status: sport.status ?? "active",
  };
}

export default function SettingsSports() {
  const {
    ready,
    syncError,
    sports,
    addSport,
    updateSport,
    removeSport,
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
    setForm(EMPTY);
    setModalOpen(true);
  };

  const startEdit = (sport) => {
    setEditingId(sport.id);
    setEditingDbId(sport.dbId ?? null);
    setForm(sportToForm(sport));
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const slug = (form.slug.trim() || slugifyId(form.name)).trim();
    const payload = {
      name: form.name.trim(),
      slug,
      icon: (form.icon.trim() || slug).trim(),
      image: form.image?.trim() ?? "",
      description: form.description.trim(),
      status: form.status,
    };

    if (!payload.name) {
      window.alert("Please enter a sport name.");
      return;
    }

    if (!payload.slug) {
      window.alert("Please enter a URL slug.");
      return;
    }

    try {
      if (editingId) {
        await updateSport(editingId, payload);
      } else {
        const slugTaken = sports.some(
          (sport) => sport.slug?.toLowerCase() === payload.slug.toLowerCase()
        );
        if (slugTaken) {
          window.alert("A sport with this slug already exists.");
          return;
        }
        await addSport(payload);
      }

      closeModal();
    } catch (err) {
      window.alert(err?.message ?? "Could not save sport.");
    }
  };

  const requestDelete = (sport) => {
    setDeleteTarget(sport);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await removeSport(deleteTarget.id);
      if (editingId === deleteTarget.id) {
        closeModal();
      }
      setDeleteTarget(null);
    } catch (err) {
      window.alert(err?.message ?? "Could not delete sport.");
    }
  };

  return (
    <>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Sports</h3>
            <p>
              {!ready
                ? "Loading from Supabase…"
                : "Manage sports, icons, images, and descriptions for booking."}
            </p>
            {syncError && <p className={styles.syncError}>{syncError}</p>}
          </div>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={startCreate}
          >
            <Plus size={16} />
            Add sport
          </button>
        </div>

        {!ready ? (
          <p className={styles.empty}>Syncing with Supabase…</p>
        ) : sports.length === 0 ? (
          <p className={styles.empty}>
            No sports listed. Add sports customers can book online.
          </p>
        ) : (
          <div className={styles.list}>
            {sports.map((sport) => (
              <article key={sport.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardMain}>
                    {sport.image ? (
                      <img
                        src={sport.image}
                        alt=""
                        className={styles.cardThumb}
                      />
                    ) : null}
                    <div>
                      <div className={styles.cardTitle}>{sport.name}</div>
                      <p className={styles.cardMeta}>
                        {sport.slug}
                        {sport.description ? ` · ${sport.description}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <span
                      className={`${styles.badge} ${
                        sport.status === "active"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {sport.status}
                    </span>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => startEdit(sport)}
                      aria-label={`Edit ${sport.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => requestDelete(sport)}
                      aria-label={`Delete ${sport.name}`}
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

      <SportFormModal
        open={modalOpen}
        mode={editingId ? "edit" : "create"}
        sportDbId={editingDbId}
        form={form}
        onChange={handleChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete sport?"
        description={`This will permanently remove "${deleteTarget?.name}" from available sports.`}
        confirmButtonLabel="Delete sport"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
