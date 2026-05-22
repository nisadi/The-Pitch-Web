"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import PitchFormModal from "./PitchFormModal";
import { useAdminSettings } from "./adminSettingsContext";
import styles from "./AdminSettings.module.css";

const EMPTY = {
  name: "",
  locationId: "",
  sportIds: [],
  peakHourRate: "",
  nonPeakHourRate: "",
  status: "active",
};

function pitchToForm(pitch) {
  const sportIds = Array.isArray(pitch.sportIds)
    ? pitch.sportIds.map(String)
    : pitch.sportId
      ? [String(pitch.sportId)]
      : [];

  return {
    name: pitch.name ?? "",
    locationId: pitch.locationId ? String(pitch.locationId) : "",
    sportIds,
    peakHourRate:
      pitch.peakHourRate != null ? String(pitch.peakHourRate) : "",
    nonPeakHourRate:
      pitch.nonPeakHourRate != null ? String(pitch.nonPeakHourRate) : "",
    status: pitch.status ?? "active",
  };
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

export default function SettingsPitches() {
  const {
    ready,
    syncError,
    usesSupabase,
    pitches,
    locations,
    sports,
    addPitch,
    updatePitch,
    removePitch,
  } = useAdminSettings();

  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const handleChange = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const startEdit = (pitch) => {
    setEditingId(pitch.id);
    setForm(pitchToForm(pitch));
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const peakRate = String(form.peakHourRate).trim();
    const nonPeakRate = String(form.nonPeakHourRate).trim();

    const sportIds = (form.sportIds ?? []).map(String).filter(Boolean);

    const payload = {
      name: form.name.trim(),
      locationId: form.locationId,
      sportIds,
      peakHourRate: Number(peakRate) || 0,
      nonPeakHourRate: Number(nonPeakRate) || 0,
      status: form.status,
    };

    if (!payload.name) {
      window.alert("Please enter a pitch name.");
      return;
    }

    if (!payload.locationId || !payload.sportIds.length) {
      window.alert("Please select a location and at least one sport.");
      return;
    }

    if (peakRate === "" || nonPeakRate === "") {
      window.alert("Please enter peak and non-peak hour rates.");
      return;
    }

    try {
      if (editingId) {
        await updatePitch(editingId, payload);
      } else {
        await addPitch(payload);
      }
      closeModal();
    } catch (err) {
      window.alert(err?.message ?? "Could not save pitch.");
    }
  };

  const requestDelete = (pitch) => {
    setDeleteTarget(pitch);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await removePitch(deleteTarget.id);
      if (editingId === deleteTarget.id) {
        closeModal();
      }
      setDeleteTarget(null);
    } catch (err) {
      window.alert(err?.message ?? "Could not delete pitch.");
    }
  };

  return (
    <>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Pitches</h3>
            <p>
              {!usesSupabase
                ? "Connect Supabase to manage pitches from the database."
                : !ready
                  ? "Loading from Supabase…"
                  : "Manage courts and pitches per location and sport."}
            </p>
            {syncError && <p className={styles.syncError}>{syncError}</p>}
          </div>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={startCreate}
            disabled={!usesSupabase}
          >
            <Plus size={16} />
            Add pitch
          </button>
        </div>

        {!usesSupabase ? (
          <p className={styles.empty}>
            Pitches are stored in Supabase. Configure NEXT_PUBLIC_SUPABASE_URL
            and your anon key in .env.local.
          </p>
        ) : !ready ? (
          <p className={styles.empty}>Syncing with Supabase…</p>
        ) : pitches.length === 0 ? (
          <p className={styles.empty}>
            No pitches yet. Add courts linked to a location and sport.
          </p>
        ) : (
          <div className={styles.list}>
            {pitches.map((pitch) => {
              const sportLabels = (pitch.sportIds?.length
                ? pitch.sportIds
                : pitch.sportId
                  ? [pitch.sportId]
                  : []
              )
                .map(
                  (sportId) =>
                    sports.find(
                      (s) =>
                        String(s.dbId) === String(sportId) ||
                        s.id === sportId ||
                        s.slug === sportId
                    )?.name ?? sportId
                )
                .join(", ");

              return (
              <article key={pitch.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardMain}>
                    <div>
                      <div className={styles.cardTitle}>{pitch.name}</div>
                      <p className={styles.cardMeta}>
                        {pitch.locationName || "Location"} ·{" "}
                        {sportLabels || pitch.sportName || "Sport"} · Peak{" "}
                        {formatPrice(pitch.peakHourRate)} · Off-peak{" "}
                        {formatPrice(pitch.nonPeakHourRate)}
                      </p>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <span
                      className={`${styles.badge} ${
                        pitch.status === "active"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {pitch.status}
                    </span>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => startEdit(pitch)}
                      aria-label={`Edit ${pitch.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => requestDelete(pitch)}
                      aria-label={`Delete ${pitch.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
            })}
          </div>
        )}
      </section>

      <PitchFormModal
        open={modalOpen}
        mode={editingId ? "edit" : "create"}
        form={form}
        locations={locations}
        sports={sports}
        onChange={handleChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete pitch?"
        description={`This will permanently remove "${deleteTarget?.name}". Existing bookings that reference this pitch may be affected.`}
        confirmButtonLabel="Delete pitch"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
