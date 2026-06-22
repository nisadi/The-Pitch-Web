"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { isUuid } from "@/lib/bookings/bookingMutations";
import { createPortal } from "react-dom";
import { Save } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isPastDateKey, isSlotBookable } from "@/lib/booking/bookingSlots";
import { DEFAULT_ADMIN_SETTINGS } from "./settings/adminSettingsDefaults";
import { formatSlotLabelFromDb, hoursToDbRange } from "@/lib/bookings/bookingMapper";
import {
  calculateBookingTotalAmount,
  getBookingAmountBreakdown,
} from "@/lib/bookings/bookingPricing";
import {
  filterBookingsForPitch,
  firstAvailableStartHour,
  formatEndHourLabel,
  getRangeDurationHours,
  getValidEndHours,
  isAdminRangeBookable,
} from "@/lib/bookings/bookingRange";
import { enrichLocationWithDefaults } from "@/lib/locations/resolveAdminLocation";
import {
  filterPitchesForBooking,
  getActivePitchesForLocation,
} from "@/lib/pitches/pitchMapper";
import { useAdminSettings } from "./settings/adminSettingsContext";
import { getBookingsForDate } from "./bookingsData";
import { formatHourLabel } from "./bookingsUtils";
import modalStyles from "./settings/LocationFormModal.module.css";

const EMPTY_FORM = {
  type: "block",
  booking_date: "",
  start_hour: "",
  end_hour: "",
  sport_id: "",
  pitch_id: "",
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  total_amount: "",
  remark: "",
  discount_type: "none",
  discount_value: "",
  final_amount: "",
};

function formatTimeValue(decimalHour) {
  if (!Number.isFinite(decimalHour)) return "";
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function calculateFinalAmount(totalAmount, discountType, discountValue) {
  const total = Number(totalAmount) || 0;
  const discount = Number(discountValue) || 0;
  if (total <= 0 || discount <= 0 || discountType === "none") return total;
  if (discountType === "percentage") {
    const capped = Math.min(discount, 100);
    return Math.max(0, Math.round(total - (total * capped) / 100));
  }
  // fixed
  return Math.max(0, Math.round(total - discount));
}

export default function AddBookingModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  location,
  sports = [],
  slotHours = [],
  bookingsForCalendar = [],
  initialDateKey = "",
  initialStartHour = null,
  initialPitchId = "",
}) {
  const formId = useId();
  const formDomId = `${formId}-form`;
  const didInitForOpen = useRef(false);
  const amountManuallyEdited = useRef(false);
  const bookingsSnapshotRef = useRef(bookingsForCalendar);
  bookingsSnapshotRef.current = bookingsForCalendar;
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitError, setSubmitError] = useState("");
  const [loadingPitches, setLoadingPitches] = useState(false);
  const [endInput, setEndInput] = useState("");
  const { pitches: settingsPitches, refreshPitches, locations: settingsLocations } =
    useAdminSettings();

  const locationWithPeriods = useMemo(
    () => enrichLocationWithDefaults(location),
    [location]
  );

  const locationLabel =
    locationWithPeriods?.shortName?.trim() ||
    locationWithPeriods?.name?.replace(/^The Pitch\s*-\s*/i, "").trim() ||
    locationWithPeriods?.name ||
    "Selected location";

  const locationSports = useMemo(() => {
    const defaults = DEFAULT_ADMIN_SETTINGS.locations.find(
      (item) => item.id === locationWithPeriods?.id
    );
    const ids =
      locationWithPeriods?.sportIds?.length > 0
        ? locationWithPeriods.sportIds
        : (defaults?.sportIds ?? []);

    const linked = !ids.length
      ? sports
      : sports.filter(
          (sport) =>
            ids.includes(sport.slug) ||
            ids.includes(sport.id) ||
            ids.includes(String(sport.dbId))
        );
    return linked.filter((sport) => sport.dbId && isUuid(String(sport.dbId)));
  }, [sports, locationWithPeriods?.sportIds, locationWithPeriods?.id]);

  const minDate = useMemo(() => {
    const t = new Date();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return `${t.getFullYear()}-${m}-${d}`;
  }, []);

  const dayBookings = useMemo(
    () => getBookingsForDate(bookingsForCalendar, form.booking_date),
    [bookingsForCalendar, form.booking_date]
  );

  const pitchDayBookings = useMemo(
    () => filterBookingsForPitch(dayBookings, form.pitch_id),
    [dayBookings, form.pitch_id]
  );

  const bookableStartOptions = useMemo(() => {
    if (!form.pitch_id) return [];
    return slotHours
      .filter((hour) => {
        if (!isSlotBookable(form.booking_date, hour)) return false;
        return (
          getValidEndHours(
            form.booking_date,
            hour,
            slotHours,
            pitchDayBookings
          ).length > 0
        );
      })
      .map((hour) => ({ hour, label: formatHourLabel(hour) }));
  }, [slotHours, form.booking_date, form.pitch_id, pitchDayBookings]);

  const validEndHours = useMemo(() => {
    if (!form.start_hour || !form.pitch_id) return [];
    return getValidEndHours(
      form.booking_date,
      Number(form.start_hour),
      slotHours,
      pitchDayBookings
    );
  }, [form.booking_date, form.start_hour, form.pitch_id, slotHours, pitchDayBookings]);

  const endOptions = useMemo(
    () =>
      validEndHours.map((hour) => ({
        hour,
        label: formatEndHourLabel(hour),
      })),
    [validEndHours]
  );

  const rangePreview = useMemo(() => {
    const start = Number(form.start_hour);
    const end = Number(form.end_hour);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return null;
    }
    const { start_time, end_time } = hoursToDbRange(start, end);
    const duration = getRangeDurationHours(start, end);
    return {
      label: formatSlotLabelFromDb(start_time, end_time),
      duration,
    };
  }, [form.start_hour, form.end_hour]);

  const bookingLocation = useMemo(() => {
    if (locationWithPeriods?.dbId) return locationWithPeriods;
    const match = settingsLocations.find(
      (loc) =>
        loc.id === location?.id ||
        loc.id === locationWithPeriods?.id ||
        loc.shortName === location?.filterValue ||
        loc.shortName === locationWithPeriods?.shortName
    );
    return match ? enrichLocationWithDefaults(match) : locationWithPeriods;
  }, [locationWithPeriods, location, settingsLocations]);

  const selectedSport = useMemo(
    () =>
      locationSports.find(
        (sport) => String(sport.dbId) === String(form.sport_id)
      ) ?? null,
    [locationSports, form.sport_id]
  );

  const pitches = useMemo(
    () =>
      filterPitchesForBooking(
        settingsPitches,
        bookingLocation,
        form.sport_id,
        selectedSport
      ),
    [settingsPitches, bookingLocation, form.sport_id, selectedSport]
  );

  const selectedPitch = useMemo(
    () =>
      pitches.find(
        (p) =>
          String(p.id) === String(form.pitch_id) ||
          String(p.dbId) === String(form.pitch_id)
      ) ?? null,
    [pitches, form.pitch_id]
  );

  const amountBreakdown = useMemo(() => {
    if (form.type === "block" || !selectedPitch) return null;
    return getBookingAmountBreakdown({
      startHour: form.start_hour,
      endHour: form.end_hour,
      location: locationWithPeriods,
      peakHourRate: selectedPitch.peakHourRate,
      nonPeakHourRate: selectedPitch.nonPeakHourRate,
    });
  }, [
    form.type,
    form.start_hour,
    form.end_hour,
    selectedPitch,
    locationWithPeriods,
  ]);

  useEffect(() => {
    if (!open || form.type === "block" || !selectedPitch) return;
    const total = calculateBookingTotalAmount({
      startHour: form.start_hour,
      endHour: form.end_hour,
      location: locationWithPeriods,
      peakHourRate: selectedPitch.peakHourRate,
      nonPeakHourRate: selectedPitch.nonPeakHourRate,
    });
    setForm((prev) => ({
      ...prev,
      total_amount: total > 0 ? String(total) : prev.total_amount,
    }));
  }, [
    open,
    form.type,
    form.start_hour,
    form.end_hour,
    form.pitch_id,
    selectedPitch,
    locationWithPeriods,
  ]);

  useEffect(() => {
    if (!open) {
      didInitForOpen.current = false;
      setForm(EMPTY_FORM);
      setSubmitError("");
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || didInitForOpen.current) return;
    didInitForOpen.current = true;

    const firstSport = locationSports[0];
    const resolvedDate =
      initialDateKey && !isPastDateKey(initialDateKey)
        ? initialDateKey
        : minDate;

    const dayList = getBookingsForDate(
      bookingsSnapshotRef.current,
      resolvedDate
    );

    const locationPitches = getActivePitchesForLocation(
      settingsPitches,
      bookingLocation
    );
    const calendarPitch =
      initialPitchId &&
      locationPitches.find(
        (p) =>
          String(p.id) === String(initialPitchId) ||
          String(p.dbId) === String(initialPitchId)
      );

    const defaultPitchId = calendarPitch
      ? String(calendarPitch.dbId ?? calendarPitch.id)
      : "";

    const pitchBookingsForInit = filterBookingsForPitch(
      dayList,
      defaultPitchId
    );

    const defaultStart =
      initialStartHour != null &&
      isSlotBookable(resolvedDate, initialStartHour) &&
      getValidEndHours(
        resolvedDate,
        Number(initialStartHour),
        slotHours,
        pitchBookingsForInit
      ).length > 0
        ? Number(initialStartHour)
        : Number(
            firstAvailableStartHour(
              resolvedDate,
              slotHours,
              pitchBookingsForInit
            ) || ""
          );

    const ends =
      Number.isFinite(defaultStart) ?
        getValidEndHours(resolvedDate, defaultStart, slotHours, pitchBookingsForInit)
      : [];

    const fallbackEnd =
      Number.isFinite(defaultStart) &&
      isAdminRangeBookable(
        resolvedDate,
        defaultStart,
        defaultStart + 1,
        pitchBookingsForInit
      )
        ? defaultStart + 1
        : null;

    const defaultEnd = ends[0] ?? fallbackEnd;

    const sportFromPitch =
      calendarPitch?.sportId && isUuid(String(calendarPitch.sportId))
        ? String(calendarPitch.sportId)
        : calendarPitch?.sportIds?.[0] && isUuid(String(calendarPitch.sportIds[0]))
          ? String(calendarPitch.sportIds[0])
          : "";

    setForm({
      type: "booking",
      booking_date: resolvedDate,
      start_hour: Number.isFinite(defaultStart) ? String(defaultStart) : "",
      end_hour: defaultEnd != null ? String(defaultEnd) : "",
      sport_id:
        sportFromPitch ||
        (firstSport?.dbId ? String(firstSport.dbId) : ""),
      pitch_id: defaultPitchId,
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      total_amount: "",
    });
    setEndInput(defaultEnd != null ? formatTimeValue(defaultEnd) : "");
  }, [
    open,
    initialDateKey,
    initialStartHour,
    initialPitchId,
    locationSports,
    slotHours,
    minDate,
    initialPitchId,
    settingsPitches,
    bookingLocation,
  ]);

  useEffect(() => {
    if (!open || !isSupabaseConfigured()) return undefined;

    let cancelled = false;
    setLoadingPitches(true);
    refreshPitches()
      .catch((err) => {
        console.error("[AddBookingModal] refresh pitches", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingPitches(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, refreshPitches, locationWithPeriods?.dbId, form.sport_id]);

  useEffect(() => {
    if (!open) return;
    setForm((prev) => {
      const hasValid = pitches.some(
        (p) =>
          String(p.id) === String(prev.pitch_id) ||
          String(p.dbId) === String(prev.pitch_id)
      );
      const firstId = pitches[0]?.id ?? pitches[0]?.dbId ?? "";
      return {
        ...prev,
        pitch_id: hasValid ? prev.pitch_id : String(firstId),
      };
    });
  }, [open, pitches]);

  useEffect(() => {
    if (!open || !form.pitch_id) return;

    const pitchBookings = filterBookingsForPitch(dayBookings, form.pitch_id);
    const startNum = Number(form.start_hour);
    const startStillValid =
      Number.isFinite(startNum) &&
      isSlotBookable(form.booking_date, startNum) &&
      getValidEndHours(
        form.booking_date,
        startNum,
        slotHours,
        pitchBookings
      ).length > 0;

    if (startStillValid) {
      const ends = getValidEndHours(
        form.booking_date,
        startNum,
        slotHours,
        pitchBookings
      );
      if (!ends.includes(Number(form.end_hour))) {
        const nextEnd = ends.length ? String(ends[0]) : "";
        setForm((prev) => ({ ...prev, end_hour: nextEnd }));
        setEndInput(nextEnd ? formatTimeValue(Number(nextEnd)) : "");
      }
      return;
    }

    const nextStart = firstAvailableStartHour(
      form.booking_date,
      slotHours,
      pitchBookings
    );
    const ends = nextStart
      ? getValidEndHours(
          form.booking_date,
          Number(nextStart),
          slotHours,
          pitchBookings
        )
      : [];

    const nextEnd = ends.length ? String(ends[0]) : "";
    setForm((prev) => ({
      ...prev,
      start_hour: nextStart,
      end_hour: nextEnd,
    }));
    setEndInput(nextEnd ? formatTimeValue(Number(nextEnd)) : "");
  }, [open, form.pitch_id, form.booking_date, dayBookings, slotHours]);

  if (!open) return null;

  const patch = (updates) => setForm((prev) => ({ ...prev, ...updates }));

  const handleStartChange = (startHour) => {
    const ends = getValidEndHours(
      form.booking_date,
      Number(startHour),
      slotHours,
      pitchDayBookings
    );
    const nextEnd = ends.length ? String(ends[0]) : "";
    patch({
      start_hour: startHour,
      end_hour: nextEnd,
    });
    setEndInput(nextEnd ? formatTimeValue(Number(nextEnd)) : "");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitError("");

    if (!locationWithPeriods?.dbId) {
      setSubmitError(
        "Location is not linked to the database. Save it in Settings → Locations."
      );
      return;
    }

    if (!form.sport_id || !isUuid(form.sport_id)) {
      setSubmitError(
        "Choose a sport that is saved in Settings (with a database ID)."
      );
      return;
    }

    if (loadingPitches) {
      setSubmitError("Loading pitches…");
      return;
    }

    if (!form.pitch_id || !isUuid(form.pitch_id)) {
      setSubmitError(
        pitches.length === 0
          ? "No active pitches for this location and sport. Add one in Settings."
          : "Select a pitch/court."
      );
      return;
    }

    if (
      !isAdminRangeBookable(
        form.booking_date,
        Number(form.start_hour),
        Number(form.end_hour),
        pitchDayBookings
      )
    ) {
      setSubmitError(
        "This time is in the past or overlaps another booking. Adjust the range."
      );
      return;
    }

    if (
      form.type === "booking" &&
      !String(form.customer_name ?? "").trim()
    ) {
      setSubmitError("Please enter the customer name.");
      return;
    }

    const endHour = Number(form.end_hour) || Number(form.start_hour) + 1;
    const finalAmt = calculateFinalAmount(
      form.total_amount,
      form.discount_type,
      form.discount_value
    );
    onSubmit({
      ...form,
      end_hour: String(endHour),
      final_amount: String(finalAmt),
    });
  };

  const isBlock = form.type === "block";
  const isRangeValid = isAdminRangeBookable(
    form.booking_date,
    Number(form.start_hour),
    Number(form.end_hour),
    pitchDayBookings
  );

  const hasCustomer = isBlock || String(form.customer_name ?? "").trim();

  const canSubmit =
    locationWithPeriods?.dbId &&
    form.booking_date &&
    form.start_hour &&
    form.end_hour &&
    form.sport_id &&
    isUuid(form.sport_id) &&
    form.pitch_id &&
    isUuid(form.pitch_id) &&
    !loadingPitches &&
    pitches.length > 0 &&
    locationSports.length > 0 &&
    hasCustomer &&
    isRangeValid;

  const submitHint =
    submitError ||
    (!locationWithPeriods?.dbId
      ? "Save this location in Settings before blocking or booking."
      : locationSports.length === 0
        ? "Link at least one sport to this location in Settings."
        : loadingPitches
          ? "Loading pitches…"
          : pitches.length === 0
            ? "No pitches for this sport at this location — add one in Settings."
            : !form.pitch_id
              ? "Select a pitch/court."
              : !isRangeValid
                ? "Pick a valid future time range that does not overlap existing bookings."
                : !hasCustomer
                  ? "Please enter the customer name."
                  : "");

  return createPortal(
    <div
      className={modalStyles.overlay}
      role="presentation"
    >
      <div
        className={modalStyles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
      >
        <header className={modalStyles.header}>
          <div className={modalStyles.headerText}>
            <h2 id={`${formId}-title`}>Add booking</h2>
            <p>
              {locationLabel} (from the header location selector). Block a slot or
              add a manual booking. Choose sport and pitch from your database.
            </p>
          </div>
        </header>

        <form
          id={formDomId}
          className={modalStyles.body}
          onSubmit={handleSubmit}
        >
          <div className={modalStyles.field}>
            <label className={modalStyles.label} htmlFor={`${formId}-type`}>
              Type
            </label>
            <select
              id={`${formId}-type`}
              className={modalStyles.input}
              value={form.type}
              onChange={(e) => {
                const nextType = e.target.value;
                patch({
                  type: nextType,
                  total_amount: nextType === "block" ? "" : form.total_amount,
                });
              }}
            >
              <option value="block">Block slot (unavailable online)</option>
              <option value="booking">Manual booking</option>
            </select>
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label} htmlFor={`${formId}-date`}>
              Date
            </label>
            <input
              id={`${formId}-date`}
              type="date"
              className={modalStyles.input}
              required
              min={minDate}
              value={form.booking_date}
              onChange={(e) => {
                const nextDate = e.target.value;
                const pitchBookings = filterBookingsForPitch(
                  getBookingsForDate(bookingsForCalendar, nextDate),
                  form.pitch_id
                );
                const nextStart = isSlotBookable(
                  nextDate,
                  Number(form.start_hour)
                ) &&
                getValidEndHours(
                  nextDate,
                  Number(form.start_hour),
                  slotHours,
                  pitchBookings
                ).length > 0
                  ? form.start_hour
                  : firstAvailableStartHour(
                      nextDate,
                      slotHours,
                      pitchBookings
                    );
                const ends = nextStart
                  ? getValidEndHours(
                      nextDate,
                      Number(nextStart),
                      slotHours,
                      pitchBookings
                    )
                  : [];
                patch({
                  booking_date: nextDate,
                  start_hour: nextStart,
                  end_hour: ends.length ? String(ends[0]) : "",
                });
              }}
            />
          </div>

          <div className={modalStyles.field}>
            <span className={modalStyles.label}>Time range</span>
            <div className={modalStyles.formRow}>
              <div className={modalStyles.field}>
                <label
                  className={modalStyles.label}
                  htmlFor={`${formId}-start`}
                  style={{ fontSize: "0.72rem" }}
                >
                  Starts
                </label>
                <select
                  id={`${formId}-start`}
                  className={modalStyles.input}
                  required
                  value={form.start_hour}
                  onChange={(e) => handleStartChange(e.target.value)}
                >
                  {bookableStartOptions.length === 0 ? (
                    <option value="">
                      {form.pitch_id
                        ? "No available slots for this court"
                        : "Select a pitch first"}
                    </option>
                  ) : (
                    bookableStartOptions.map(({ hour, label }) => (
                      <option key={hour} value={String(hour)}>
                        {label}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className={modalStyles.field}>
                <label
                  className={modalStyles.label}
                  htmlFor={`${formId}-end`}
                  style={{ fontSize: "0.72rem" }}
                >
                  Ends at
                </label>
                <input
                  id={`${formId}-end`}
                  type="text"
                  placeholder="23:30"
                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"
                  maxLength={5}
                  className={modalStyles.input}
                  required
                  disabled={!form.start_hour}
                  value={endInput}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9:]/g, "");
                    // Auto-insert colon if they type 2 digits
                    if (val.length === 2 && !val.includes(':') && endInput.length < val.length) {
                      val += ':';
                    }
                    setEndInput(val);

                    // Update form.end_hour live when input looks like a valid time
                    const parts = val.split(":");
                    if (parts.length === 2 && parts[1].length === 2) {
                      const hour = parseInt(parts[0], 10);
                      const min = parseInt(parts[1], 10);
                      if (Number.isFinite(hour) && Number.isFinite(min) && hour >= 0 && hour <= 24 && min >= 0 && min <= 59) {
                        patch({ end_hour: String(hour + min / 60) });
                      }
                    }
                  }}
                  onBlur={() => {
                    const [hh, mm] = endInput.split(":");
                    const hour = parseInt(hh, 10);
                    const min = parseInt(mm || "0", 10);
                    
                    if (Number.isFinite(hour) && hour >= 0 && hour <= 24) {
                      const decimal = hour + (Number.isFinite(min) ? min / 60 : 0);
                      patch({ end_hour: String(decimal) });
                      setEndInput(formatTimeValue(decimal));
                    } else {
                      patch({ end_hour: "" });
                      setEndInput("");
                    }
                  }}
                />
              </div>
            </div>
            {rangePreview ? (
              <p
                className={modalStyles.hint}
                style={{ marginTop: "0.5rem", marginBottom: 0 }}
              >
                {rangePreview.duration}{" "}
                {rangePreview.duration === 1 ? "hour" : "hours"} ·{" "}
                {rangePreview.label}
              </p>
            ) : (
              <p
                className={modalStyles.hint}
                style={{ marginTop: "0.5rem", marginBottom: 0 }}
              >
                Choose start and end times. Multi-hour bookings block every hour
                in between.
              </p>
            )}
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label} htmlFor={`${formId}-sport`}>
              Sport
            </label>
            <select
              id={`${formId}-sport`}
              className={modalStyles.input}
              required
              value={form.sport_id}
              onChange={(e) =>
                patch({ sport_id: e.target.value, pitch_id: "" })
              }
            >
              {locationSports.length === 0 ? (
                <option value="">No sports linked to this location</option>
              ) : (
                locationSports.map((sport) => (
                  <option key={sport.dbId} value={String(sport.dbId)}>
                    {sport.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label} htmlFor={`${formId}-pitch`}>
              Pitch / court
            </label>
            <select
              id={`${formId}-pitch`}
              className={modalStyles.input}
              required
              value={form.pitch_id}
              onChange={(e) => patch({ pitch_id: e.target.value })}
              disabled={
                loadingPitches || !form.sport_id || pitches.length === 0
              }
            >
              {loadingPitches ? (
                <option value="">Loading pitches…</option>
              ) : pitches.length === 0 ? (
                <option value="">
                  No pitches for this sport at {locationLabel}
                </option>
              ) : (
                pitches.map((pitch) => (
                  <option
                    key={pitch.id ?? pitch.dbId}
                    value={String(pitch.id ?? pitch.dbId)}
                  >
                    {pitch.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {!isBlock && (
            <>
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Customer details</span>
                <p className={modalStyles.hint} style={{ marginBottom: "0.65rem" }}>
                  Stored on this booking. Without these fields, the calendar may
                  show another user from the database.
                </p>
              </div>
              <div className={modalStyles.field}>
                <label
                  className={modalStyles.label}
                  htmlFor={`${formId}-customer`}
                >
                  Customer name <span className={modalStyles.required}>*</span>
                </label>
                <input
                  id={`${formId}-customer`}
                  type="text"
                  className={modalStyles.input}
                  placeholder="Full name"
                  value={form.customer_name}
                  onChange={(e) =>
                    patch({ customer_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className={modalStyles.formRow}>
                <div className={modalStyles.field}>
                  <label
                    className={modalStyles.label}
                    htmlFor={`${formId}-email`}
                  >
                    Email
                  </label>
                  <input
                    id={`${formId}-email`}
                    type="email"
                    className={modalStyles.input}
                    placeholder="customer@example.com"
                    value={form.customer_email}
                    onChange={(e) =>
                      patch({ customer_email: e.target.value })
                    }
                  />
                </div>
                <div className={modalStyles.field}>
                  <label
                    className={modalStyles.label}
                    htmlFor={`${formId}-phone`}
                  >
                    Phone
                  </label>
                  <input
                    id={`${formId}-phone`}
                    type="tel"
                    className={modalStyles.input}
                    placeholder="+94 77 123 4567"
                    value={form.customer_phone}
                    onChange={(e) =>
                      patch({ customer_phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className={modalStyles.field}>
                <label className={modalStyles.label} htmlFor={`${formId}-amount`}>
                  Amount (LKR)
                </label>
                <input
                  id={`${formId}-amount`}
                  type="number"
                  min="0"
                  step="1"
                  className={modalStyles.input}
                  value={form.total_amount}
                  onChange={(e) => {
                    amountManuallyEdited.current = true;
                    patch({ total_amount: e.target.value });
                  }}
                />
                {amountBreakdown &&
                (amountBreakdown.total > 0 ||
                  (selectedPitch?.peakHourRate > 0 &&
                    selectedPitch?.nonPeakHourRate > 0)) ? (
                  <p
                    className={modalStyles.hint}
                    style={{ marginTop: "0.35rem", marginBottom: 0 }}
                  >
                    Auto-calculated from {selectedPitch?.name ?? "pitch"} rates
                    {amountBreakdown.peakHours > 0
                      ? ` · ${amountBreakdown.peakHours} peak hr${amountBreakdown.peakHours === 1 ? "" : "s"} @ LKR ${amountBreakdown.peakRate.toLocaleString("en-LK")}`
                      : ""}
                    {amountBreakdown.nonPeakHours > 0
                      ? ` · ${amountBreakdown.nonPeakHours} off-peak hr${amountBreakdown.nonPeakHours === 1 ? "" : "s"} @ LKR ${amountBreakdown.nonPeakRate.toLocaleString("en-LK")}`
                      : ""}
                    {amountBreakdown.otherHours > 0
                      ? ` · ${amountBreakdown.otherHours} other hr${amountBreakdown.otherHours === 1 ? "" : "s"} @ off-peak rate`
                      : ""}
                  </p>
                ) : selectedPitch && rangePreview ? (
                  <p
                    className={modalStyles.hint}
                    style={{ marginTop: "0.35rem", marginBottom: 0 }}
                  >
                    {selectedPitch.peakHourRate > 0 ||
                    selectedPitch.nonPeakHourRate > 0
                      ? "Select a pitch and valid start/end times to calculate the amount."
                      : "Set peak and non-peak rates on this pitch in Settings → Pitches to auto-fill the amount."}
                  </p>
                ) : null}
              </div>
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Discount</span>
                <div className={modalStyles.formRow}>
                  <div className={modalStyles.field}>
                    <label
                      className={modalStyles.label}
                      htmlFor={`${formId}-discount-type`}
                      style={{ fontSize: "0.72rem" }}
                    >
                      Type
                    </label>
                    <select
                      id={`${formId}-discount-type`}
                      className={modalStyles.input}
                      value={form.discount_type}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        patch({
                          discount_type: nextType,
                          discount_value: nextType === "none" ? "" : form.discount_value,
                        });
                      }}
                    >
                      <option value="none">No discount</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed amount (LKR)</option>
                    </select>
                  </div>
                  {form.discount_type !== "none" && (
                    <div className={modalStyles.field}>
                      <label
                        className={modalStyles.label}
                        htmlFor={`${formId}-discount-value`}
                        style={{ fontSize: "0.72rem" }}
                      >
                        {form.discount_type === "percentage" ? "Percentage" : "Amount"}
                      </label>
                      <input
                        id={`${formId}-discount-value`}
                        type="number"
                        min="0"
                        max={form.discount_type === "percentage" ? "100" : undefined}
                        step="0.01"
                        className={modalStyles.input}
                        placeholder={form.discount_type === "percentage" ? "e.g. 10" : "e.g. 500"}
                        value={form.discount_value ?? ""}
                        onChange={(e) => patch({ discount_value: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                {form.discount_type !== "none" && Number(form.discount_value) > 0 && Number(form.total_amount) > 0 && (
                  <p
                    className={modalStyles.hint}
                    style={{ marginTop: "0.35rem", marginBottom: 0 }}
                  >
                    Discount:{" "}
                    {form.discount_type === "percentage"
                      ? `${form.discount_value}% of LKR ${Number(form.total_amount).toLocaleString("en-LK")}`
                      : `LKR ${Number(form.discount_value).toLocaleString("en-LK")}`}
                    {" "}= LKR{" "}
                    {(
                      Number(form.total_amount) -
                      calculateFinalAmount(
                        form.total_amount,
                        form.discount_type,
                        form.discount_value
                      )
                    ).toLocaleString("en-LK")}{" "}
                    off
                  </p>
                )}
              </div>
              {(form.discount_type !== "none" && Number(form.discount_value) > 0) && (
                <div className={modalStyles.field}>
                  <label className={modalStyles.label}>
                    Final amount (LKR)
                  </label>
                  <input
                    type="text"
                    className={modalStyles.input}
                    readOnly
                    value={
                      Number(form.total_amount) > 0
                        ? calculateFinalAmount(
                            form.total_amount,
                            form.discount_type,
                            form.discount_value
                          ).toLocaleString("en-LK")
                        : "—"
                    }
                    style={{ fontWeight: 700, color: "var(--primary, #A3FF00)" }}
                  />
                </div>
              )}
              <div className={modalStyles.field}>
                <label className={modalStyles.label} htmlFor={`${formId}-remark`}>
                  Remarks
                </label>
                <textarea
                  id={`${formId}-remark`}
                  className={modalStyles.input}
                  rows={2}
                  placeholder="Optional notes about this booking..."
                  value={form.remark}
                  onChange={(e) => patch({ remark: e.target.value })}
                  style={{ resize: "vertical", minHeight: "3rem" }}
                />
              </div>
            </>
          )}
        </form>

        <footer className={modalStyles.footer}>
          {submitHint ? (
            <p
              className={modalStyles.hint}
              style={{
                marginBottom: "0.75rem",
                color: submitError ? "#f87171" : undefined,
              }}
              role={submitError ? "alert" : undefined}
            >
              {submitHint}
            </p>
          ) : null}
          <button
            type="button"
            className={modalStyles.backBtn}
            style={{ marginBottom: "0.75rem", width: "100%" }}
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formDomId}
            className={modalStyles.saveBtn}
            disabled={submitting || !canSubmit}
          >
            <Save size={16} />
            {submitting
              ? "Saving…"
              : isBlock
                ? "Block slot"
                : "Add booking"}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
