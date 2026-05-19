import { toDateKey } from "./bookingsData";
import {
  DEFAULT_OPERATIONAL_END,
  DEFAULT_OPERATIONAL_START,
} from "./settings/adminSettingsDefaults";

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
export function getOperationalHours(
  operationalStart = DEFAULT_OPERATIONAL_START,
  operationalEnd = DEFAULT_OPERATIONAL_END
) {
  const start = parseTimeField(operationalStart);
  const end = parseTimeField(operationalEnd);

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

export function compareTimeStrings(start, end) {
  const a = parseTimeField(start);
  const b = parseTimeField(end);
  return a.hour * 60 + a.minute - (b.hour * 60 + b.minute);
}

export function isOperationalRangeValid(start, end) {
  return compareTimeStrings(start, end) < 0;
}

export function formatOperationalHoursDisplay(operationalStart, operationalEnd) {
  const formatPoint = (timeStr) => {
    const { hour, minute } = parseTimeField(timeStr);
    const period = hour >= 12 ? "PM" : "AM";
    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;
    return `${displayHour}.${String(minute).padStart(2, "0")} ${period}`;
  };

  return `${formatPoint(operationalStart)} – ${formatPoint(operationalEnd)}`;
}

export function parseTimeStart(timeStr) {
  const part = timeStr.split("-")[0].trim();
  const match = part.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
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

function formatClockTime(hour, minute = 0) {
  const period = hour >= 12 ? "PM" : "AM";
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  const mins = String(minute).padStart(2, "0");
  return { text: `${displayHour}.${mins}`, period };
}

/** Hour slot label for calendar rows, e.g. 8.00 - 9.00 AM */
export function formatHourLabel(hour) {
  const start = formatClockTime(hour);
  const end = formatClockTime(hour + 1);

  if (start.period === end.period) {
    return `${start.text} - ${end.text} ${start.period}`;
  }

  return `${start.text} ${start.period} - ${end.text} ${end.period}`;
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
