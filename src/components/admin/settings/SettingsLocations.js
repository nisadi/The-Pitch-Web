"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import LocationFormModal from "./LocationFormModal";
import { slugifyId } from "./adminSettingsDefaults";
import { useAdminSettings } from "./adminSettingsContext";
import styles from "./AdminSettings.module.css";

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
  status: "active",
};

export default function SettingsLocations() {
  const { locations, sports, addLocation, updateLocation, removeLocation } =
    useAdminSettings();
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
    setForm({
      name: location.name,
      shortName: location.shortName,
      address: location.address,
      phone: location.phone,
      description: location.description ?? "",
      image: location.image ?? "",
      peakHourRate: String(location.peakHourRate ?? ""),
      nonPeakHourRate: String(location.nonPeakHourRate ?? ""),
      sportIds: location.sportIds ?? [],
      status: location.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      description: form.description.trim(),
      image: form.image,
      peakHourRate: Number(form.peakHourRate),
      nonPeakHourRate: Number(form.nonPeakHourRate),
    };

    if (
      !payload.name ||
      !payload.shortName ||
      !payload.address ||
      !payload.phone ||
      !payload.peakHourRate ||
      !payload.nonPeakHourRate ||
      !form.sportIds?.length
    ) {
      return;
    }

    if (!editingId && !payload.image) {
      window.alert("Please upload a location image.");
      return;
    }

    if (editingId) {
      updateLocation(editingId, payload);
    } else {
      const id = slugifyId(payload.shortName);
      if (locations.some((loc) => loc.id === id)) {
        window.alert("A location with this name already exists.");
        return;
      }
      addLocation({ ...payload, id });
    }

    closeModal();
  };

  const requestDelete = (location) => {
    if (locations.length <= 1) {
      window.alert("You must keep at least one location.");
      return;
    }
    setDeleteTarget(location);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    removeLocation(deleteTarget.id);
    if (editingId === deleteTarget.id) {
      closeModal();
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Locations</h3>
            <p>Add venues, addresses, and contact details used across bookings and reports.</p>
          </div>
          <button type="button" className={styles.primaryBtn} onClick={startCreate}>
            <Plus size={16} />
            Add location
          </button>
        </div>

        {locations.length === 0 ? (
          <p className={styles.empty}>No locations yet. Add your first venue to get started.</p>
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
