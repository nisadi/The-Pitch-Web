"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CloudUpload,
  Info,
  Lightbulb,
  Save,
} from "lucide-react";
import { isOperationalRangeValid } from "../bookingsUtils";
import styles from "./LocationFormModal.module.css";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function LocationFormModal({
  open,
  mode = "create",
  form,
  sports = [],
  onChange,
  onClose,
  onSubmit,
}) {
  const fileInputId = useId();
  const fileRef = useRef(null);
  const isEdit = mode === "edit";

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

  if (!open) return null;

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      window.alert("Please upload a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      window.alert("Image must be 5MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange({ image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  const activeSports = sports.filter((sport) => sport.status === "active");
  const selectedSportIds = form.sportIds ?? [];

  const toggleSport = (sportId) => {
    const next = selectedSportIds.includes(sportId)
      ? selectedSportIds.filter((id) => id !== sportId)
      : [...selectedSportIds, sportId];
    onChange({ sportIds: next });
  };

  const peakRate = String(form.peakHourRate ?? "").trim();
  const nonPeakRate = String(form.nonPeakHourRate ?? "").trim();
  const ratesValid =
    peakRate !== "" &&
    nonPeakRate !== "" &&
    !Number.isNaN(Number(peakRate)) &&
    !Number.isNaN(Number(nonPeakRate)) &&
    Number(peakRate) >= 0 &&
    Number(nonPeakRate) >= 0;

  const canSave =
    form.name.trim() &&
    form.shortName.trim() &&
    form.address.trim() &&
    form.phone.trim() &&
    ratesValid &&
    selectedSportIds.length > 0 &&
    form.operationalStart &&
    form.operationalEnd &&
    isOperationalRangeValid(form.operationalStart, form.operationalEnd) &&
    (isEdit || Boolean(form.image));

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
        onClick={(event) => event.stopPropagation()}
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
            <h2 id="location-modal-title">
              {isEdit ? "Edit location" : "Add location"}
            </h2>
            <p>
              {isEdit
                ? "Update venue details and contact information."
                : "Add a new venue and set contact details."}
            </p>
          </div>
        </header>

        <form
          id="location-modal-form"
          className={styles.body}
          onSubmit={handleSubmit}
        >
          <div className={styles.infoBanner}>
            <Info size={18} />
            <span>
              Add location details and contact information. Active venues appear
              in the header location selector and bookings.
            </span>
          </div>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Location details</h3>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="loc-modal-name">
                Location name <span className={styles.required}>*</span>
              </label>
              <input
                id="loc-modal-name"
                className={styles.input}
                value={form.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Enter location name"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="loc-modal-short">
                Short name <span className={styles.required}>*</span>
              </label>
              <p className={styles.hint}>
                Used in filters and the location dropdown (e.g. Maharagama).
              </p>
              <input
                id="loc-modal-short"
                className={styles.input}
                value={form.shortName}
                onChange={(e) => onChange({ shortName: e.target.value })}
                placeholder="Enter short name"
                required
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>
                Location image{" "}
                {!isEdit && <span className={styles.required}>*</span>}
              </span>
              <input
                id={fileInputId}
                ref={fileRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className={styles.hiddenInput}
                onChange={handleImageChange}
              />
              {form.image ? (
                <div
                  className={`${styles.uploadZone} ${styles.uploadZoneHasImage}`}
                >
                  <img
                    src={form.image}
                    alt="Location preview"
                    className={styles.previewImage}
                  />
                  <div className={styles.previewActions}>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => fileRef.current?.click()}
                    >
                      Change image
                    </button>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => onChange({ image: "" })}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor={fileInputId} className={styles.uploadZone}>
                  <CloudUpload size={28} className={styles.uploadIcon} />
                  <span className={styles.uploadTitle}>Upload location image</span>
                  <span className={styles.uploadHint}>
                    JPG, PNG or WEBP (Max. 5MB)
                  </span>
                </label>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="loc-modal-desc">
                Description
              </label>
              <textarea
                id="loc-modal-desc"
                className={styles.textarea}
                value={form.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Enter location description"
              />
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Operational hours</h3>
            <p className={styles.hint} style={{ marginBottom: "0.75rem" }}>
              Set when this venue is open. The bookings calendar week and day
              views use these times for the selected location.
            </p>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="loc-modal-op-start">
                  Opens at <span className={styles.required}>*</span>
                </label>
                <input
                  id="loc-modal-op-start"
                  type="time"
                  className={styles.input}
                  value={form.operationalStart ?? "08:00"}
                  onChange={(e) =>
                    onChange({ operationalStart: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="loc-modal-op-end">
                  Closes at <span className={styles.required}>*</span>
                </label>
                <input
                  id="loc-modal-op-end"
                  type="time"
                  className={styles.input}
                  value={form.operationalEnd ?? "21:00"}
                  onChange={(e) => onChange({ operationalEnd: e.target.value })}
                  required
                />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Pricing details</h3>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="loc-modal-peak">
                  Peak hour rate <span className={styles.required}>*</span>
                </label>
                <p className={styles.hint}>
                  Price during peak hours (evenings and weekends).
                </p>
                <input
                  id="loc-modal-peak"
                  type="number"
                  min="0"
                  step="1"
                  className={styles.input}
                  value={form.peakHourRate}
                  onChange={(e) => onChange({ peakHourRate: e.target.value })}
                  placeholder="Enter peak hour rate"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="loc-modal-offpeak">
                  Non-peak hour rate <span className={styles.required}>*</span>
                </label>
                <p className={styles.hint}>
                  Price during non-peak hours (daytime and weekdays).
                </p>
                <input
                  id="loc-modal-offpeak"
                  type="number"
                  min="0"
                  step="1"
                  className={styles.input}
                  value={form.nonPeakHourRate}
                  onChange={(e) =>
                    onChange({ nonPeakHourRate: e.target.value })
                  }
                  placeholder="Enter non-peak hour rate"
                  required
                />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Available sports</h3>
            <div className={styles.field}>
              <span className={styles.label}>
                Sports at this location <span className={styles.required}>*</span>
              </span>
              <p className={styles.hint}>
                Select which sports customers can book at this venue.
              </p>
              {activeSports.length === 0 ? (
                <p className={styles.emptySports}>
                  No active sports configured. Add sports under Settings → Sports
                  first.
                </p>
              ) : (
                <div className={styles.sportGrid}>
                  {activeSports.map((sport) => {
                    const checked = selectedSportIds.includes(sport.id);
                    return (
                      <label
                        key={sport.id}
                        className={`${styles.sportOption} ${checked ? styles.sportOptionChecked : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSport(sport.id)}
                        />
                        <span className={styles.sportOptionText}>
                          <span className={styles.sportOptionName}>{sport.name}</span>
                          {sport.description && (
                            <span className={styles.sportOptionDesc}>
                              {sport.description}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Contact & address</h3>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="loc-modal-address">
                Address <span className={styles.required}>*</span>
              </label>
              <p className={styles.hint}>
                Full street address shown on bookings and customer communications.
              </p>
              <textarea
                id="loc-modal-address"
                className={styles.textarea}
                value={form.address}
                onChange={(e) => onChange({ address: e.target.value })}
                placeholder="Enter full address"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="loc-modal-phone">
                Phone <span className={styles.required}>*</span>
              </label>
              <p className={styles.hint}>Contact number for this venue.</p>
              <input
                id="loc-modal-phone"
                className={styles.input}
                value={form.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="loc-modal-status">
                Status
              </label>
              <select
                id="loc-modal-status"
                className={styles.select}
                value={form.status}
                onChange={(e) => onChange({ status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </section>

          <div className={styles.tips}>
            <Lightbulb size={18} />
            <div>
              <p className={styles.tipsTitle}>Tips</p>
              <p>
                Peak hours typically include evenings and weekends. Inactive
                locations won&apos;t appear in the header selector. You can update
                rates anytime.
              </p>
            </div>
          </div>
        </form>

        <footer className={styles.footer}>
          <button
            type="submit"
            className={styles.saveBtn}
            form="location-modal-form"
            disabled={!canSave}
          >
            <Save size={18} />
            {isEdit ? "Save changes" : "Save location"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
