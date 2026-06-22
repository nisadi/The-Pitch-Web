import { normalizeDbTime } from "@/lib/locations/locationMapper";
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
 * Build hourly booking slot labels from a location's operational hours
 * (same range as Admin → Settings → Locations "Hours: …").
 */
export function buildSlotsFromLocation(location, selectedDate = new Date()) {
  if (!location) return [];

  const start = normalizeDbTime(location.open_time, "08:00");
  const end = normalizeDbTime(location.close_time, "21:00");
  const hours = getOperationalHours(start, end);
  const now = new Date();
  const isToday = isSameCalendarDay(selectedDate, now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return hours.map((hour) => {
    const time = formatHourLabel(hour);
    const isPast =
      isToday && hour * 60 < nowMinutes;

    return {
      time,
      startHour: hour,
      status: isPast ? "past" : "available",
    };
  });
}
