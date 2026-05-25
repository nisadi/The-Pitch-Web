"use client";

import { useEffect, useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Info, Lightbulb, Save } from "lucide-react";
import styles from "./LocationFormModal.module.css";

export default function PitchFormModal({
  open,
  mode = "create",
  form,
  locations = [],
  sports = [],
  onChange,
  onClose,
  onSubmit,
}) {
  const formDomId = useId();
  const isEdit = mode === "edit";

  const dbLocations = useMemo(
    () => locations.filter((loc) => loc.dbId),
    [locations]
  );

  const dbSports = useMemo(() => sports.filter((sport) => sport.dbId), [sports]);

  const sportsForLocation = useMemo(() => {
    if (!form.locationId) return [];
    const location = dbLocations.find(
      (loc) => String(loc.dbId) === String(form.locationId)
    );
    const ids = location?.sportIds ?? [];
    if (!ids.length) return dbSports;
    return dbSports.filter(
      (sport) =>
        ids.includes(sport.slug) ||
        ids.includes(sport.id) ||
        ids.includes(String(sport.dbId))
    );
  }, [form.locationId, dbLocations, dbSports]);

  const activeSportsForLocation = useMemo(
    () => sportsForLocation.filter((sport) => sport.status === "active"),
    [sportsForLocation]
  );

  const selectedSportIds = form.sportIds ?? [];

  const toggleSport = (sportDbId) => {
    const id = String(sportDbId);
    const next = selectedSportIds.includes(id)
      ? selectedSportIds.filter((item) => item !== id)
      : [...selectedSportIds, id];
    onChange({ sportIds: next });
  };

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

  const handleLocationChange = (locationId) => {
    onChange({ locationId, sportId: "" });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  const peakRate = String(form.peakHourRate ?? "").trim();
  const nonPeakRate = String(form.nonPeakHourRate ?? "").trim();

  const canSave =
    form.name.trim() &&
    form.locationId &&
    selectedSportIds.length > 0 &&
    peakRate !== "" &&
    nonPeakRate !== "" &&
    Number(peakRate) >= 0 &&
    Number(nonPeakRate) >= 0;

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
        aria-labelledby="pitch-modal-title"
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
            <h2 id="pitch-modal-title">
              {isEdit ? "Edit pitch" : "Add pitch"}
            </h2>
            <p>
              Courts and pitches are stored in the pitches table and linked to a
              location and sport for booking.
            </p>
          </div>
        </header>

        <form
          id={formDomId}
          className={styles.body}
          onSubmit={handleSubmit}
        >
          <div className={styles.infoBanner}>
            <Info size={18} />
            <span>
              Each pitch belongs to one venue (location) and one sport. Used in
              the admin calendar and public booking flow.
            </span>
          </div>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Pitch details</h3>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pitch-modal-name">
                Pitch name <span className={styles.required}>*</span>
              </label>
              <input
                id="pitch-modal-name"
                className={styles.input}
                value={form.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="e.g. Futsal Court A"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pitch-modal-location">
                Location <span className={styles.required}>*</span>
              </label>
              <select
                id="pitch-modal-location"
                className={styles.select}
                value={form.locationId}
                onChange={(e) => handleLocationChange(e.target.value)}
                required
              >
                <option value="">Select location</option>
                {dbLocations.map((loc) => (
                  <option key={loc.dbId} value={String(loc.dbId)}>
                    {loc.shortName || loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <span className={styles.label} id="pitch-modal-sport-label">
                Sports <span className={styles.required}>*</span>
              </span>
              <p className={styles.hint}>
                {form.locationId
                  ? "Select every sport this pitch can be booked for. Only sports enabled on the selected location are shown."
                  : "Select a location first to see available sports."}
              </p>
              {!form.locationId ? (
                <p className={styles.emptySports}>
                  Select a location above to choose sports.
                </p>
              ) : activeSportsForLocation.length === 0 ? (
                <p className={styles.emptySports}>
                  No active sports at this location. Edit the location under
                  Settings → Locations and add sports first.
                </p>
              ) : (
                <div
                  className={styles.sportGrid}
                  role="group"
                  aria-labelledby="pitch-modal-sport-label"
                >
                  {activeSportsForLocation.map((sport) => {
                    const value = String(sport.dbId);
                    const checked = selectedSportIds.includes(value);
                    return (
                      <label
                        key={sport.dbId}
                        className={`${styles.sportOption} ${checked ? styles.sportOptionChecked : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSport(sport.dbId)}
                        />
                        <span className={styles.sportOptionText}>
                          <span className={styles.sportOptionName}>
                            {sport.name}
                          </span>
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

            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="pitch-modal-peak">
                  Peak hour rate (LKR) <span className={styles.required}>*</span>
                </label>
                <p className={styles.hint}>
                  Price during peak hours (evenings and weekends).
                </p>
                <input
                  id="pitch-modal-peak"
                  type="number"
                  min="0"
                  step="1"
                  className={styles.input}
                  value={form.peakHourRate}
                  onChange={(e) =>
                    onChange({ peakHourRate: e.target.value })
                  }
                  placeholder="e.g. 4500"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="pitch-modal-offpeak">
                  Non-peak hour rate (LKR){" "}
                  <span className={styles.required}>*</span>
                </label>
                <p className={styles.hint}>
                  Price during non-peak hours (daytime and weekdays).
                </p>
                <input
                  id="pitch-modal-offpeak"
                  type="number"
                  min="0"
                  step="1"
                  className={styles.input}
                  value={form.nonPeakHourRate}
                  onChange={(e) =>
                    onChange({ nonPeakHourRate: e.target.value })
                  }
                  placeholder="e.g. 3000"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pitch-modal-status">
                Status
              </label>
              <select
                id="pitch-modal-status"
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
                Inactive pitches are hidden from the booking modal. Add at least
                one active pitch per location and sport you offer.
              </p>
            </div>
          </div>
        </form>

        <footer className={styles.footer}>
          <button
            type="submit"
            className={styles.saveBtn}
            form={formDomId}
            disabled={!canSave}
          >
            <Save size={18} />
            {isEdit ? "Save changes" : "Save pitch"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
