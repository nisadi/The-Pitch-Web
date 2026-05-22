"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  applyGalleryRealtimeEvent,
  fetchGalleryFromSupabase,
  subscribeToGallery,
} from "@/lib/gallery/galleryData";
import {
  deleteGalleryItemClient,
  upsertGalleryItemClient,
} from "@/lib/gallery/galleryMutations";
import DeleteConfirmModal from "./DeleteConfirmModal";
import GalleryFormModal from "./GalleryFormModal";
import styles from "./AdminSettings.module.css";

const EMPTY = {
  title: "",
  imageUrl: "",
  category: "Ground",
  position: "bottom",
  sortOrder: 0,
  status: "active",
};

function itemToForm(item) {
  return {
    title: item.title ?? "",
    imageUrl: item.imageUrl ?? "",
    category: item.category ?? "Ground",
    position: item.position ?? "bottom",
    sortOrder: item.sortOrder ?? 0,
    status: item.status ?? "active",
  };
}

export default function SettingsGallery() {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingDbId, setEditingDbId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setSyncError("Supabase is not configured.");
      setReady(true);
      return;
    }

    try {
      setSyncError(null);
      const rows = await fetchGalleryFromSupabase();
      setItems(rows);
    } catch (err) {
      console.error(err);
      setSyncError(err?.message ?? "Could not load gallery.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return undefined;

    return subscribeToGallery((payload) => {
      setItems((prev) => applyGalleryRealtimeEvent(prev, payload));
    });
  }, []);

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
      sortOrder: items.length,
    });
    setModalOpen(true);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditingDbId(item.dbId ?? null);
    setForm(itemToForm(item));
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      dbId: editingDbId,
      title: form.title.trim(),
      imageUrl: form.imageUrl.trim(),
      category: form.category,
      position: form.position,
      sortOrder: form.sortOrder,
      status: form.status,
    };

    if (!payload.title || !payload.imageUrl) {
      window.alert("Please add a title and upload an image.");
      return;
    }

    try {
      const saved = await upsertGalleryItemClient(payload);
      setItems((prev) => {
        const exists = prev.some(
          (item) => item.dbId === saved.dbId || item.id === saved.id
        );
        if (exists) {
          return prev.map((item) =>
            item.dbId === saved.dbId || item.id === saved.id ? saved : item
          );
        }
        return [...prev, saved].sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            (a.title ?? "").localeCompare(b.title ?? "")
        );
      });
      setSyncError(null);
      closeModal();
      void load();
    } catch (err) {
      window.alert(err?.message ?? "Could not save gallery photo.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteGalleryItemClient(deleteTarget);
      if (editingId === deleteTarget.id) {
        closeModal();
      }
      setDeleteTarget(null);
    } catch (err) {
      window.alert(err?.message ?? "Could not delete photo.");
    }
  };

  return (
    <>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Gallery</h3>
            <p>
              {!ready
                ? "Loading from Supabase…"
                : "Manage photos shown on the public Gallery page (/gallery)."}
            </p>
            {syncError && <p className={styles.syncError}>{syncError}</p>}
          </div>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={startCreate}
            disabled={!isSupabaseConfigured()}
          >
            <Plus size={16} />
            Add photo
          </button>
        </div>

        {!isSupabaseConfigured() ? (
          <p className={styles.empty}>
            Connect Supabase in .env.local to manage gallery images.
          </p>
        ) : !ready ? (
          <p className={styles.empty}>Syncing with Supabase…</p>
        ) : items.length === 0 ? (
          <p className={styles.empty}>
            No gallery photos yet. Add images to populate the website gallery
            section.
          </p>
        ) : (
          <div className={styles.list}>
            {items.map((item) => (
              <article key={item.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardMain}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className={styles.cardThumb}
                      />
                    ) : null}
                    <div>
                      <div className={styles.cardTitle}>{item.title}</div>
                      <p className={styles.cardMeta}>
                        {item.category}
                        {item.position ? ` · ${item.position}` : ""}
                        {item.sortOrder != null ? ` · order ${item.sortOrder}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <span
                      className={`${styles.badge} ${
                        item.status === "active"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {item.status}
                    </span>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => startEdit(item)}
                      aria-label={`Edit ${item.title}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`Delete ${item.title}`}
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

      <GalleryFormModal
        open={modalOpen}
        mode={editingId ? "edit" : "create"}
        galleryDbId={editingDbId}
        form={form}
        onChange={handleChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete gallery photo?"
        description={`This will remove "${deleteTarget?.title}" from the website gallery.`}
        confirmButtonLabel="Delete photo"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
