"use client";

import { useEffect, useId, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CloudUpload,
  Info,
  Lightbulb,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { uploadLocationImage } from "@/lib/storage/uploadLocationImage";
import styles from "./LocationFormModal.module.css";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// 0 = Monday … 6 = Sunday
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseHHmm(str) {
  if (!str) return null;
  const [h, m] = str.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function isSlotValid(startKey, endKey, slot) {
  const s = parseHHmm(slot[startKey]);
  let e = parseHHmm(slot[endKey]);

  if (e === 0 && s !== null && s >= 0) {
    e = 24 * 60;
  }

  return s !== null && e !== null && s < e;
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = (i % 2 === 0) ? '00' : '30';
  return `${h}:${m}`;
});

function TimeSelect24({ id, value, onChange, ariaLabel, className }) {
  const options = useMemo(() => {
    if (!value) return TIME_OPTIONS;
    if (!TIME_OPTIONS.includes(value)) {
      const newOptions = [...TIME_OPTIONS, value];
      newOptions.sort();
      return newOptions;
    }
    return TIME_OPTIONS;
  }, [value]);

  return (
    <select
      id={id}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
    >
      <option value="" disabled>Time</option>
      {options.map((time) => (
        <option key={time} value={time}>{time}</option>
      ))}
    </select>
  );
}

function TimeSlotRow({ slot, startKey, endKey, onUpdate, onRemove, prefix }) {
  const startId = `${prefix}-start`;
  const endId = `${prefix}-end`;
  return (
    <div className={styles.slotRow}>
      <TimeSelect24
        id={startId}
        className={styles.slotTimeInput}
        value={slot[startKey] ?? ""}
        onChange={(val) => onUpdate({ [startKey]: val })}
        ariaLabel="Start time"
      />
      <span className={styles.slotDash}>–</span>
      <TimeSelect24
        id={endId}
        className={styles.slotTimeInput}
        value={slot[endKey] ?? ""}
        onChange={(val) => onUpdate({ [endKey]: val })}
        ariaLabel="End time"
      />
      <button
        type="button"
        className={styles.slotRemoveBtn}
        onClick={onRemove}
        aria-label="Remove slot"
        title="Remove this slot"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function DayTimeSlotsEditor({
  title,
  hint,
  slots,
  selectedDay,
  startKey,
  endKey,
  emptyLabel,
  addLabel,
  defaultSlot,
  onAddSlot,
  onUpdateSlot,
  onRemoveSlot,
}) {
  const daySlots = slots.filter((s) => s.dateId === selectedDay);

  return (
    <div className={styles.slotSection}>
      <p className={styles.slotSectionLabel}>{title}</p>
      {hint && <p className={styles.slotHint}>{hint}</p>}
      {daySlots.length === 0 ? (
        <p className={styles.slotEmpty}>{emptyLabel}</p>
      ) : (
        <div className={styles.slotList}>
          {daySlots.map((slot, localIdx) => {
            const globalIdx = slots.findIndex(
              (s, i) =>
                s.dateId === selectedDay &&
                slots.filter((x, j) => x.dateId === selectedDay && j < i)
                  .length === localIdx
            );
            return (
              <TimeSlotRow
                key={localIdx}
                slot={slot}
                startKey={startKey}
                endKey={endKey}
                prefix={`slot-${selectedDay}-${localIdx}-${title.toLowerCase().replace(/\s+/g, "-")}`}
                onUpdate={(patch) => onUpdateSlot(selectedDay, localIdx, patch)}
                onRemove={() => onRemoveSlot(selectedDay, localIdx)}
              />
            );
          })}
        </div>
      )}
      <button
        type="button"
        className={styles.addSlotBtn}
        onClick={() => onAddSlot(selectedDay, defaultSlot)}
      >
        <Plus size={13} />
        {addLabel}
      </button>
    </div>
  );
}

export default function LocationFormModal({
  open,
  mode = "create",
  locationDbId = null,
  locationSlug = null,
  form,
  sports = [],
  onChange,
  onClose,
  onSubmit,
}) {
  const fileInputId = useId();
  const fileRef = useRef(null);
  const previewUrlRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedDay, setSelectedDay] = useState(0); // 0=Mon
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

  useEffect(() => {
    if (!open) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl("");
      setUploadingImage(false);
      setSelectedDay(0);
      return;
    }

    if (form.image && !form.image.startsWith("data:")) {
      setPreviewUrl(form.image);
    }
  }, [open, form.image]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  if (!open) return null;

  const displayImage =
    previewUrl || (form.image && !form.image.startsWith("data:") ? form.image : "");

  // ---------------------------------------------------------------------------
  // Image handlers
  // ---------------------------------------------------------------------------
  const handleImageChange = async (event) => {
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

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const localPreview = URL.createObjectURL(file);
    previewUrlRef.current = localPreview;
    setPreviewUrl(localPreview);

    setUploadingImage(true);
    try {
      const publicUrl = await uploadLocationImage(file, {
        locationId: locationDbId,
        locationSlug,
        locationName: form.name,
      });
      onChange({ image: publicUrl });
      setPreviewUrl(publicUrl);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    } catch (err) {
      window.alert(err?.message ?? "Could not upload image.");
      onChange({ image: "" });
      setPreviewUrl("");
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    onChange({ image: "" });
    setPreviewUrl("");
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  // ---------------------------------------------------------------------------
  // Sports
  // ---------------------------------------------------------------------------
  const activeSports = sports.filter((sport) => sport.status === "active");
  const selectedSportIds = form.sportIds ?? [];

  const toggleSport = (sportId) => {
    const next = selectedSportIds.includes(sportId)
      ? selectedSportIds.filter((id) => id !== sportId)
      : [...selectedSportIds, sportId];
    onChange({ sportIds: next });
  };

  // ---------------------------------------------------------------------------
  // Open time slots CRUD
  // ---------------------------------------------------------------------------
  const openTimeMappings = form.openTimeMappings ?? [];
  const peakTimeMappings = form.peakTimeMappings ?? [];

  function addOpenSlot(dateId, defaultSlot = { openTime: "08:00", closeTime: "21:00" }) {
    onChange({
      openTimeMappings: [...openTimeMappings, { dateId, ...defaultSlot }],
    });
  }

  function updateOpenSlot(dateId, localIdx, patch) {
    let dayCount = -1;
    const next = openTimeMappings.map((s) => {
      if (s.dateId !== dateId) return s;
      dayCount++;
      return dayCount === localIdx ? { ...s, ...patch } : s;
    });
    onChange({ openTimeMappings: next });
  }

  function removeOpenSlot(dateId, localIdx) {
    let dayCount = -1;
    const next = openTimeMappings.filter((s) => {
      if (s.dateId !== dateId) return true;
      dayCount++;
      return dayCount !== localIdx;
    });
    onChange({ openTimeMappings: next });
  }

  // ---------------------------------------------------------------------------
  // Peak time slots CRUD
  // ---------------------------------------------------------------------------
  function addPeakSlot(dateId, defaultSlot = { startTime: "18:00", endTime: "22:00" }) {
    onChange({
      peakTimeMappings: [...peakTimeMappings, { dateId, ...defaultSlot }],
    });
  }

  function updatePeakSlot(dateId, localIdx, patch) {
    let dayCount = -1;
    const next = peakTimeMappings.map((s) => {
      if (s.dateId !== dateId) return s;
      dayCount++;
      return dayCount === localIdx ? { ...s, ...patch } : s;
    });
    onChange({ peakTimeMappings: next });
  }

  function removePeakSlot(dateId, localIdx) {
    let dayCount = -1;
    const next = peakTimeMappings.filter((s) => {
      if (s.dateId !== dateId) return true;
      dayCount++;
      return dayCount !== localIdx;
    });
    onChange({ peakTimeMappings: next });
  }

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const openSlotsAllValid = openTimeMappings.every((s) =>
    isSlotValid("openTime", "closeTime", s)
  );
  const peakSlotsAllValid = peakTimeMappings.every((s) =>
    isSlotValid("startTime", "endTime", s)
  );
  const hasAtLeastOneOpenSlot = openTimeMappings.length > 0;

  const canSave =
    form.name.trim() &&
    form.shortName.trim() &&
    form.address.trim() &&
    form.phone.trim() &&
    selectedSportIds.length > 0 &&
    hasAtLeastOneOpenSlot &&
    openSlotsAllValid &&
    peakSlotsAllValid &&
    (isEdit || Boolean(form.image)) &&
    !uploadingImage;

  // Indicators per day in the tab bar
  function dayHasOpen(dateId) {
    return openTimeMappings.some((s) => s.dateId === dateId);
  }
  function dayHasPeak(dateId) {
    return peakTimeMappings.some((s) => s.dateId === dateId);
  }

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

          {/* ---------------------------------------------------------------- */}
          {/* Location details                                                  */}
          {/* ---------------------------------------------------------------- */}
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
              {displayImage ? (
                <div
                  className={`${styles.uploadZone} ${styles.uploadZoneHasImage}`}
                >
                  <img
                    src={displayImage}
                    alt="Location preview"
                    className={styles.previewImage}
                  />
                  <div className={styles.previewActions}>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => fileRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? "Uploading…" : "Change image"}
                    </button>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={handleRemoveImage}
                      disabled={uploadingImage}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor={fileInputId}
                  className={styles.uploadZone}
                  aria-busy={uploadingImage}
                >
                  <CloudUpload size={28} className={styles.uploadIcon} />
                  <span className={styles.uploadTitle}>
                    {uploadingImage ? "Uploading…" : "Upload location image"}
                  </span>
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

          {/* ---------------------------------------------------------------- */}
          {/* Open & Peak hours — per day of week                              */}
          {/* ---------------------------------------------------------------- */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Open &amp; Peak hours</h3>
            <p className={styles.hint} style={{ marginBottom: "0.9rem" }}>
              Configure when this venue is open and when peak pricing applies,
              per day of the week. Select a day then add one or more time
              windows. Days with no open slots will not appear in the booking
              calendar.
            </p>

            {/* Day selector tabs */}
            <div className={styles.daySelector} role="tablist" aria-label="Day of week">
              {DAY_LABELS.map((label, idx) => {
                const hasOpen = dayHasOpen(idx);
                const hasPeak = dayHasPeak(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={selectedDay === idx}
                    className={`${styles.dayTab} ${selectedDay === idx ? styles.dayTabActive : ""
                      } ${hasOpen ? styles.dayTabHasOpen : ""}`}
                    onClick={() => setSelectedDay(idx)}
                  >
                    {label}
                    {(hasOpen || hasPeak) && (
                      <span className={styles.dayTabDots}>
                        {hasOpen && (
                          <span
                            className={styles.dayTabDot}
                            style={{ background: "var(--primary)" }}
                            title="Has open hours"
                          />
                        )}
                        {hasPeak && (
                          <span
                            className={styles.dayTabDot}
                            style={{ background: "#f59e0b" }}
                            title="Has peak hours"
                          />
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className={styles.dayPanels}>
              {/* Open hours for selected day */}
              <DayTimeSlotsEditor
                title="Open hours"
                hint="When is this venue open on this day?"
                slots={openTimeMappings}
                selectedDay={selectedDay}
                startKey="openTime"
                endKey="closeTime"
                emptyLabel="No open hours set — this venue is considered closed on this day."
                addLabel="Add open window"
                defaultSlot={{ openTime: "08:00", closeTime: "21:00" }}
                onAddSlot={addOpenSlot}
                onUpdateSlot={updateOpenSlot}
                onRemoveSlot={removeOpenSlot}
              />

              {/* Peak hours for selected day */}
              <DayTimeSlotsEditor
                title="Peak hours"
                hint="Peak pricing applies during these windows. Non-peak is everything else within open hours."
                slots={peakTimeMappings}
                selectedDay={selectedDay}
                startKey="startTime"
                endKey="endTime"
                emptyLabel="No peak windows — all open hours are treated as off-peak."
                addLabel="Add peak window"
                defaultSlot={{ startTime: "18:00", endTime: "22:00" }}
                onAddSlot={addPeakSlot}
                onUpdateSlot={updatePeakSlot}
                onRemoveSlot={removePeakSlot}
              />
            </div>

            {!hasAtLeastOneOpenSlot && (
              <p className={styles.validationError}>
                At least one open-hours window is required across all days.
              </p>
            )}
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Available sports                                                  */}
          {/* ---------------------------------------------------------------- */}
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
                          {sport.description ? (
                            <span className={styles.sportOptionDesc}>
                              {sport.description}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Contact & address                                                 */}
          {/* ---------------------------------------------------------------- */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Contact &amp; address</h3>

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
                Add multiple open windows per day (e.g. 08:00–12:00 and
                16:00–21:00). Peak hours drive higher pricing — set rates per
                pitch under Settings → Pitches. Days with no open hours
                will show no time rows in the calendar.
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
