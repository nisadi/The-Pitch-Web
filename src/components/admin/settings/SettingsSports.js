"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { slugifyId } from "./adminSettingsDefaults";
import { useAdminSettings } from "./adminSettingsContext";
import styles from "./AdminSettings.module.css";

const EMPTY = {
  name: "",
  description: "",
  status: "active",
};

export default function SettingsSports() {
  const { sports, addSport, updateSport, removeSport } = useAdminSettings();
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const startEdit = (sport) => {
    setEditingId(sport.id);
    setForm({
      name: sport.name,
      description: sport.description,
      status: sport.status,
    });
    setShowForm(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
    };

    if (!payload.name) return;

    if (editingId) {
      updateSport(editingId, payload);
    } else {
      const id = slugifyId(payload.name);
      if (sports.some((sport) => sport.id === id)) {
        window.alert("A sport with this name already exists.");
        return;
      }
      addSport({ ...payload, id });
    }

    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
  };

  const requestDelete = (sport) => {
    setDeleteTarget(sport);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    removeSport(deleteTarget.id);
    if (editingId === deleteTarget.id) {
      setShowForm(false);
      setEditingId(null);
    }
    setDeleteTarget(null);
  };

  return (
    <>
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3>Sports</h3>
          <p>Configure which sports can be booked at your venues.</p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={startCreate}>
          <Plus size={16} />
          Add sport
        </button>
      </div>

      {sports.length === 0 ? (
        <p className={styles.empty}>No sports listed. Add sports customers can book online.</p>
      ) : (
        <div className={styles.list}>
          {sports.map((sport) => (
            <article key={sport.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardTitle}>{sport.name}</div>
                  <p className={styles.cardMeta}>{sport.description || "No description"}</p>
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

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label} htmlFor="sport-name">
                Sport name
              </label>
              <input
                id="sport-name"
                className={styles.input}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Futsal"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="sport-status">
                Status
              </label>
              <select
                id="sport-status"
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
              <label className={styles.label} htmlFor="sport-desc">
                Description
              </label>
              <textarea
                id="sport-desc"
                className={styles.textarea}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Short description shown during booking"
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn}>
              {editingId ? "Save changes" : "Add sport"}
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

    <DeleteConfirmModal
      open={Boolean(deleteTarget)}
      title="Delete sport?"
      description={`This will permanently remove "${deleteTarget?.name}" from available sports. It will also be removed from any locations that offer this sport.`}
      confirmButtonLabel="Delete sport"
      onClose={() => setDeleteTarget(null)}
      onConfirm={confirmDelete}
    />
    </>
  );
}
