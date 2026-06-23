import { toDateKey } from "./bookingsData";
import {
  getOpenSlotsForDay,
  getOperationalWindowForDay,
} from "@/lib/locations/locationTimeMapper";

export function parseTimeField(timeStr) {
  const [hourPart, minutePart] = (timeStr || "00:00").split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart) || 0;
  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

/** Booking slot start hours for week/day grid (e.g. 8 → 8.00-9.00 AM). */
export function getOperationalHours(operationalStart, operationalEnd) {
  if (!operationalStart || !operationalEnd) return [];

  const start = parseTimeField(operationalStart);
  const end = parseTimeField(operationalEnd);

  if (end.hour === 0 && end.minute === 0 && start.hour >= 0) {
    end.hour = 24;
  }

  const startHour = start.hour;
  let lastSlotHour = end.minute === 0 ? end.hour - 1 : end.hour;

  if (lastSlotHour < startHour) {
    lastSlotHour = startHour;
  }

  return Array.from(
    { length: lastSlotHour - startHour + 1 },
    (_, index) => startHour + index
  );
}

/**
 * Derive booking slot hour rows from openTimeMappings for a specific dateId
 * (0=Mon … 6=Sun).  Returns an empty array when the location has no open
 * hours configured for that day — the calendar will show an empty-day message.
 *
 * When a location has multiple open windows for a day (e.g. 08:00–12:00 and
 * 16:00–21:00) the rows span the full range from the earliest open to the
 * latest close so the grid stays contiguous.
 */
export function getOperationalHoursForDay(openTimeMappings, dateId) {
  const window = getOperationalWindowForDay(openTimeMappings, dateId);
  if (!window) return [];
  return getOperationalHours(window.operationalStart, window.operationalEnd);
}

export function compareTimeStrings(start, end) {
  const a = parseTimeField(start);
  const b = parseTimeField(end);
  if (b.hour === 0 && b.minute === 0 && (a.hour > 0 || a.minute > 0)) b.hour = 24;
  return a.hour * 60 + a.minute - (b.hour * 60 + b.minute);
}

export function isOperationalRangeValid(start, end) {
  return compareTimeStrings(start, end) < 0;
}

/** True when periodStart–periodEnd lies within operationalStart–operationalEnd (inclusive). */
export function isPeriodWithinOperational(
  periodStart,
  periodEnd,
  operationalStart,
  operationalEnd
) {
  if (!isOperationalRangeValid(periodStart, periodEnd)) return false;
  if (!isOperationalRangeValid(operationalStart, operationalEnd)) return false;

  const os = parseTimeField(operationalStart);
  const oe = parseTimeField(operationalEnd);
  if (oe.hour === 0 && oe.minute === 0 && (os.hour > 0 || os.minute > 0)) oe.hour = 24;

  const ps = parseTimeField(periodStart);
  const pe = parseTimeField(periodEnd);
  if (pe.hour === 0 && pe.minute === 0 && (ps.hour > 0 || ps.minute > 0)) pe.hour = 24;

  const osMin = os.hour * 60 + os.minute;
  const oeMin = oe.hour * 60 + oe.minute;
  const psMin = ps.hour * 60 + ps.minute;
  const peMin = pe.hour * 60 + pe.minute;

  return osMin <= psMin && peMin <= oeMin;
}

export function formatOperationalHoursDisplay(operationalStart, operationalEnd) {
  const formatPoint = (timeStr) => {
    const { hour, minute } = parseTimeField(timeStr);
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  return `${formatPoint(operationalStart)} – ${formatPoint(operationalEnd)}`;
}

export function parseTimeStart(timeStr) {
  const part = timeStr.split("-")[0].trim();
  const trailingPeriod = timeStr.match(/\b(AM|PM)\s*$/i)?.[1]?.toUpperCase();
  const match = part.match(/(\d+)[.:](\d+)\s*(AM|PM)?/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = (match[3] || trailingPeriod)?.toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function getBookingStartHour(booking) {
  if (typeof booking?.startHour === "number") return booking.startHour;
  return Math.floor(parseTimeStart(booking?.time ?? "") / 60);
}

export function getBookingTimeRangeMinutes(booking) {
  const start = parseTimeField(booking?.startTime);
  const end = parseTimeField(booking?.endTime);
  const startMin = start.hour * 60 + start.minute;
  const endMin = end.hour * 60 + end.minute;
  return Math.max(60, endMin - startMin);
}

/** True when a booking occupies any part of the calendar hour row. */
export function bookingOverlapsHour(booking, hour) {
  if (!booking) return false;
  if (booking.bookingStatus === "cancelled") return false;

  const start = parseTimeField(booking.startTime);
  const end = parseTimeField(booking.endTime);
  if (end.hour === 0 && end.minute === 0 && start.hour >= 0) end.hour = 24;

  const bookingStart = start.hour * 60 + start.minute;
  const bookingEnd = end.hour * 60 + end.minute;
  const slotStart = hour * 60;
  const slotEnd = (hour + 1) * 60;

  return bookingStart < slotEnd && bookingEnd > slotStart;
}

/** Min height per hour row in day view (fits compact booking card without overlap). */
export const DAY_VIEW_ROW_BASE_PX = 76;

/** Min row height (px) for day view from booking duration. */
export function dayRowMinHeightForBooking(
  booking,
  basePx = DAY_VIEW_ROW_BASE_PX
) {
  const minutes = getBookingTimeRangeMinutes(booking);
  const rows = Math.max(1, Math.ceil(minutes / 60));
  return rows * basePx;
}

export function sortBookingsByTime(bookings) {
  return [...bookings].sort(
    (a, b) => parseTimeStart(a.time) - parseTimeStart(b.time)
  );
}

export function dateFromKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getWeekDateKeys(reference) {
  const date = reference instanceof Date ? reference : dateFromKey(reference);
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return toDateKey(day.getFullYear(), day.getMonth(), day.getDate());
  });
}

/** Hour slot label for calendar rows, e.g. 08:00 – 09:00 */
export function formatHourLabel(hour) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hour)}:00 – ${pad(hour + 1)}:00`;
}

export function formatShortDate(dateKey) {
  return dateFromKey(dateKey).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatHeaderRange(view, focusDate) {
  const month = focusDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  if (view === "month") return month;

  if (view === "day") {
    return focusDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const weekKeys = getWeekDateKeys(focusDate);
  const start = dateFromKey(weekKeys[0]);
  const end = dateFromKey(weekKeys[6]);

  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}
