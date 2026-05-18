import { toDateKey } from "./bookingsData";

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

export function formatHourLabel(hour) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
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
