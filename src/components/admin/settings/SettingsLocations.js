"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import LocationFormModal from "./LocationFormModal";
import {
  formatOperationalHoursDisplay,
  isOperationalRangeValid,
  isPeriodWithinOperational,
} from "../bookingsUtils";
import {
  DEFAULT_NON_PEAK_END,
  DEFAULT_NON_PEAK_START,
  DEFAULT_PEAK_END,
  DEFAULT_PEAK_START,
} from "./adminSettingsDefaults";
import { slugifyId } from "./adminSettingsDefaults";
import { useAdminSettings } from "./adminSettingsContext";
import styles from "./AdminSettings.module.css";

const CAN_ADD_LOCATIONS = true;

const EMPTY = {
  name: "",
  shortName: "",
  address: "",
  phone: "",
  description: "",
  image: "",
  sportIds: [],
  operationalStart: "08:00",
  operationalEnd: "21:00",
  nonPeakStart: DEFAULT_NON_PEAK_START,
  nonPeakEnd: DEFAULT_NON_PEAK_END,
  peakStart: DEFAULT_PEAK_START,
  peakEnd: DEFAULT_PEAK_END,
  status: "active",
};

function locationToForm(location) {
  return {
    name: location.name ?? "",
    shortName: location.shortName ?? "",
    address: location.address ?? "",
    phone: location.phone ?? "",
    description: location.description ?? "",
    image: location.image ?? "",
    sportIds: Array.isArray(location.sportIds) ? [...location.sportIds] : [],
    operationalStart: location.operationalStart ?? "08:00",
    operationalEnd: location.operationalEnd ?? "21:00",
    nonPeakStart: location.nonPeakStart ?? DEFAULT_NON_PEAK_START,
    nonPeakEnd: location.nonPeakEnd ?? DEFAULT_NON_PEAK_END,
    peakStart: location.peakStart ?? DEFAULT_PEAK_START,
    peakEnd: location.peakEnd ?? DEFAULT_PEAK_END,
    status: location.status ?? "active",
  };
}

export default function SettingsLocations() {
  const {
    ready,
    syncError,
    locations,
    sports,
    addLocation,
    updateLocation,
    removeLocation,
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
    if (!CAN_ADD_LOCATIONS) return;
    setEditingId(null);
    setEditingDbId(null);
    setForm({
      ...EMPTY,
      sportIds: sports
        .filter((sport) => sport.status === "active")
        .map((sport) => sport.id),
    });
    setModalOpen(true);
  };

  const startEdit = (location) => {
    setEditingId(location.id);
    setEditingDbId(location.dbId ?? null);
    setForm(locationToForm(location));
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      description: form.description.trim(),
      image: form.image ?? "",
      sportIds: form.sportIds ?? [],
      operationalStart: form.operationalStart,
      operationalEnd: form.operationalEnd,
      nonPeakStart: form.nonPeakStart,
      nonPeakEnd: form.nonPeakEnd,
      peakStart: form.peakStart,
      peakEnd: form.peakEnd,
      status: form.status,
    };

    if (
      !payload.name ||
      !payload.shortName ||
      !payload.address ||
      !payload.phone ||
      !payload.sportIds.length ||
      !payload.operationalStart ||
      !payload.operationalEnd
    ) {
      window.alert("Please fill in all required fields.");
      return;
    }

    if (!isOperationalRangeValid(payload.operationalStart, payload.operationalEnd)) {
      window.alert("Closing time must be after opening time.");
      return;
    }

    if (!isOperationalRangeValid(payload.nonPeakStart, payload.nonPeakEnd)) {
      window.alert("Non-peak end time must be after non-peak start time.");
      return;
    }

    if (!isOperationalRangeValid(payload.peakStart, payload.peakEnd)) {
      window.alert("Peak end time must be after peak start time.");
      return;
    }

    if (
      !isPeriodWithinOperational(
        payload.nonPeakStart,
        payload.nonPeakEnd,
        payload.operationalStart,
        payload.operationalEnd
      )
    ) {
      window.alert(
        "Non-peak hours must fall within the venue operational hours."
      );
      return;
    }

    if (
      !isPeriodWithinOperational(
        payload.peakStart,
        payload.peakEnd,
        payload.operationalStart,
        payload.operationalEnd
      )
    ) {
      window.alert("Peak hours must fall within the venue operational hours.");
      return;
    }

    if (
      !editingId &&
      (!payload.image || payload.image.startsWith("data:"))
    ) {
      window.alert("Please upload a location image.");
      return;
    }

    try {
      if (editingId) {
        await updateLocation(editingId, payload);
      } else if (!CAN_ADD_LOCATIONS) {
        window.alert("Adding new locations is disabled.");
        return;
      } else {
        const id = slugifyId(payload.shortName);
        if (locations.some((loc) => loc.id === id)) {
          window.alert("A location with this name already exists.");
          return;
        }
        await addLocation({ ...payload, id });
      }

      closeModal();
    } catch (err) {
      window.alert(err?.message ?? "Could not save location.");
    }
  };

  const requestDelete = (location) => {
    if (locations.length <= 1) {
      window.alert("You must keep at least one location.");
      return;
    }
    setDeleteTarget(location);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await removeLocation(deleteTarget.id);
      if (editingId === deleteTarget.id) {
        closeModal();
      }
      setDeleteTarget(null);
    } catch (err) {
      window.alert(err?.message ?? "Could not delete location.");
    }
  };

  return (
    <>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Locations</h3>
            <p>
              {!ready
                ? "Loading from Supabase…"
                : "Update addresses and contact details for existing venues used across bookings and reports."}
            </p>
            {syncError && <p className={styles.syncError}>{syncError}</p>}
          </div>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={startCreate}
            disabled={!CAN_ADD_LOCATIONS}
            title={
              CAN_ADD_LOCATIONS
                ? "Add a new venue"
                : "Adding locations is disabled. Edit an existing venue below."
            }
          >
            <Plus size={16} />
            Add location
          </button>
        </div>

        {!ready ? (
          <p className={styles.empty}>Syncing with Supabase…</p>
        ) : locations.length === 0 ? (
          <p className={styles.empty}>No locations configured.</p>
        ) : (
          <div className={styles.list}>
            {locations.map((location) => (
              <article key={location.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.cardTitle}>{location.name}</div>
                    {location.description && (
                      <p className={styles.cardMeta}>{location.description}</p>
                    )}
                    <p className={styles.cardMeta}>
                      <MapPin size={14} style={{ display: "inline", marginRight: 4 }} />
                      {location.address}
                    </p>
                    <p className={styles.cardMeta}>{location.phone}</p>
                    <p className={styles.cardMeta}>
                      Hours:{" "}
                      {formatOperationalHoursDisplay(
                        location.operationalStart,
                        location.operationalEnd
                      )}
                    </p>
                    <p className={styles.cardMeta}>
                      Off-peak:{" "}
                      {formatOperationalHoursDisplay(
                        location.nonPeakStart,
                        location.nonPeakEnd
                      )}
                      {" · "}
                      Peak:{" "}
                      {formatOperationalHoursDisplay(
                        location.peakStart,
                        location.peakEnd
                      )}
                    </p>
                    {(location.sportIds?.length ?? 0) > 0 && (
                      <div className={styles.tagList}>
                        {location.sportIds.map((sportId) => {
                          const sport = sports.find((item) => item.id === sportId);
                          return (
                            <span key={sportId} className={styles.tag}>
                              {sport?.name ?? sportId}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    <span
                      className={`${styles.badge} ${
                        location.status === "active"
                          ? styles.badgeActive
                          : styles.badgeInactive
                      }`}
                    >
                      {location.status}
                    </span>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => startEdit(location)}
                      aria-label={`Edit ${location.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => requestDelete(location)}
                      aria-label={`Delete ${location.name}`}
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

      <LocationFormModal
        open={modalOpen}
        mode={editingId ? "edit" : "create"}
        locationDbId={editingDbId}
        locationSlug={editingId}
        form={form}
        sports={sports}
        onChange={handleChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete location?"
        description={`This will permanently remove "${deleteTarget?.name}". Offers linked to this venue will be updated. This action cannot be undone.`}
        confirmButtonLabel="Delete location"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
