import { normalizeDbTimeField, dateToDateId, getOperationalWindowForDay } from "@/lib/locations/locationTimeMapper";
import {
  getOperationalHours,
  formatHourLabel,
} from "@/components/admin/bookingsUtils";

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** True if the calendar day is strictly before today (local time). */
export function isPastDate(date) {
  return startOfDay(date).getTime() < startOfDay(new Date()).getTime();
}

/** `dateKey` format: YYYY-MM-DD */
export function isPastDateKey(dateKey) {
  if (!dateKey) return false;
  const [y, m, d] = dateKey.split("-").map(Number);
  return isPastDate(new Date(y, m - 1, d));
}

/** True if the hour slot on `dateKey` is in the past (local time). */
export function isPastSlot(dateKey, hour, now = new Date()) {
  if (!dateKey || hour == null || !Number.isFinite(Number(hour))) return false;
  if (isPastDateKey(dateKey)) return true;

  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (!isSameCalendarDay(date, now)) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return Number(hour) * 60 < nowMinutes;
}

export function isSlotBookable(dateKey, hour, now = new Date()) {
  return !isPastSlot(dateKey, hour, now);
}

/** True when every hour from startHour (inclusive) to endHour (exclusive) is bookable. */
export function isRangeBookable(dateKey, startHour, endHour, now = new Date()) {
  const start = Number(startHour);
  const end = Number(endHour);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return false;
  }
  // Check each whole hour the range touches (start is always integer from the dropdown,
  // end can be fractional like 13.5 for 13:30 — we need to check up to Math.ceil(end)-1)
  const lastHour = Math.ceil(end) - 1;
  for (let hour = Math.floor(start); hour <= lastHour; hour++) {
    if (!isSlotBookable(dateKey, hour, now)) return false;
  }
  return true;
}

export function isSelectableSlot(slot, selectedDate, now = new Date()) {
  if (!slot || slot.status !== "available") return false;
  if (isPastDate(selectedDate)) return false;
  if (!isSameCalendarDay(selectedDate, now)) return true;
  const slotStartMinutes = (slot.startHour ?? 0) * 60;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return slotStartMinutes >= nowMinutes;
}

/**
 * Returns true if the 1-hour slot starting at `hour` overlaps any peak window
 * for the given day.
 *
 * @param {Array}  peakMappings - [{ dateId, startTime, endTime }]
 * @param {number} dateId       - 0=Mon … 6=Sun
 * @param {number} hour         - integer hour (e.g. 15 for 15:00)
 */
function isHourPeak(peakMappings, dateId, hour) {
  if (!peakMappings?.length) return false;

  const slotStart = hour * 60;        // in minutes
  const slotEnd   = slotStart + 60;

  return peakMappings.some((mapping) => {
    if (mapping.dateId !== dateId) return false;

    // startTime / endTime come normalised as "HH:MM"
    const [sh, sm] = (mapping.startTime ?? "00:00").split(":").map(Number);
    const [eh, em] = (mapping.endTime   ?? "00:00").split(":").map(Number);

    const peakStart = sh * 60 + (sm || 0);
    let   peakEnd   = eh * 60 + (em || 0);
    // Midnight sentinel (00:00 as end means next-day midnight)
    if (peakEnd === 0 && peakStart > 0) peakEnd = 24 * 60;

    // Overlap: slot starts before peak ends AND slot ends after peak starts
    return slotStart < peakEnd && slotEnd > peakStart;
  });
}

/**
 * Build hourly booking slot labels from a location's operational hours.
 * Uses openTimeMappings to derive the start/end for the given date.
 * Tags each slot with `isPeak` based on peakTimeMappings.
 *
 * @param {object} location      - normalised location with openTimeMappings & peakTimeMappings
 * @param {Date}   selectedDate  - date for which to build slots (used to determine day-of-week)
 */
export function buildSlotsFromLocation(location, selectedDate = new Date()) {
  if (!location) return [];

  const dateId = dateToDateId(selectedDate);
  const peakMappings = Array.isArray(location.peakTimeMappings)
    ? location.peakTimeMappings
    : [];

  // New path: per-day open-time mappings
  if (Array.isArray(location.openTimeMappings)) {
    const dayWindow = getOperationalWindowForDay(location.openTimeMappings, dateId);
    if (!dayWindow) return []; // location is closed on this day

    const hours = getOperationalHours(dayWindow.operationalStart, dayWindow.operationalEnd);
    const now = new Date();
    const isToday = isSameCalendarDay(selectedDate, now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    return hours.map((hour) => ({
      time: formatHourLabel(hour),
      startHour: hour,
      status: isToday && hour * 60 < nowMinutes ? "past" : "available",
      isPeak: isHourPeak(peakMappings, dateId, hour),
    }));
  }

  // Legacy fallback: flat open_time / close_time fields
  const start = normalizeDbTimeField(location.open_time) ?? "08:00";
  const end = normalizeDbTimeField(location.close_time) ?? "21:00";
  const hours = getOperationalHours(start, end);
  const now = new Date();
  const isToday = isSameCalendarDay(selectedDate, now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return hours.map((hour) => ({
    time: formatHourLabel(hour),
    startHour: hour,
    status: isToday && hour * 60 < nowMinutes ? "past" : "available",
    isPeak: isHourPeak(peakMappings, dateId, hour),
  }));
}
