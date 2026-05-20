"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import LocationFormModal from "./LocationFormModal";
import {
  formatOperationalHoursDisplay,
  isOperationalRangeValid,
} from "../bookingsUtils";
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
  peakHourRate: "",
  nonPeakHourRate: "",
  sportIds: [],
  operationalStart: "08:00",
  operationalEnd: "21:00",
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
    peakHourRate: String(location.peakHourRate ?? ""),
    nonPeakHourRate: String(location.nonPeakHourRate ?? ""),
    sportIds: Array.isArray(location.sportIds) ? [...location.sportIds] : [],
    operationalStart: location.operationalStart ?? "08:00",
    operationalEnd: location.operationalEnd ?? "21:00",
    status: location.status ?? "active",
  };
}

function isValidRates(peak, nonPeak) {
  return (
    peak !== "" &&
    nonPeak !== "" &&
    !Number.isNaN(Number(peak)) &&
    !Number.isNaN(Number(nonPeak)) &&
    Number(peak) >= 0 &&
    Number(nonPeak) >= 0
  );
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
    const peakRate = String(form.peakHourRate).trim();
    const nonPeakRate = String(form.nonPeakHourRate).trim();

    const payload = {
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      description: form.description.trim(),
      image: form.image ?? "",
      peakHourRate: Number(peakRate),
      nonPeakHourRate: Number(nonPeakRate),
      sportIds: form.sportIds ?? [],
      operationalStart: form.operationalStart,
      operationalEnd: form.operationalEnd,
      status: form.status,
    };

    if (
      !payload.name ||
      !payload.shortName ||
      !payload.address ||
      !payload.phone ||
      !isValidRates(peakRate, nonPeakRate) ||
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
                      Peak LKR {Number(location.peakHourRate || 0).toLocaleString("en-LK")}{" "}
                      · Off-peak LKR{" "}
                      {Number(location.nonPeakHourRate || 0).toLocaleString("en-LK")}
                    </p>
                    <p className={styles.cardMeta}>
                      Hours:{" "}
                      {formatOperationalHoursDisplay(
                        location.operationalStart,
                        location.operationalEnd
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
