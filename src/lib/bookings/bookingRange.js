import { parseTimeField } from "@/components/admin/bookingsUtils";
import { isRangeBookable, isSlotBookable } from "@/lib/booking/bookingSlots";

function formatDecimalHour(decimalHour) {
  const hour = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hour) * 60);
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function hoursToDbRange(startHour, endHour) {
  const start = Number(startHour);
  let end = Number(endHour);
  if (!Number.isFinite(start)) {
    return { start_time: "08:00", end_time: "09:00" };
  }
  if (!Number.isFinite(end) || end <= start) {
    end = start + 1;
  }
  return {
    start_time: formatDecimalHour(start),
    end_time: formatDecimalHour(end),
  };
}

export function getRangeDurationHours(startHour, endHour) {
  const start = Number(startHour);
  const end = Number(endHour);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  return end - start;
}

function timeToMinutes(timeStr) {
  const { hour, minute } = parseTimeField(timeStr);
  return hour * 60 + minute;
}

/** Interval overlap for HH:mm times on the same day. */
export function dbTimesOverlap(startA, endA, startB, endB) {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);
  return aStart < bEnd && aEnd > bStart;
}

export function hourRangeOverlapsBooking(booking, startHour, endHour) {
  if (!booking?.startTime || !booking?.endTime) return false;
  if (booking.bookingStatus === "cancelled") return false;

  const { start_time, end_time } = hoursToDbRange(startHour, endHour);
  return dbTimesOverlap(
    start_time,
    end_time,
    booking.startTime,
    booking.endTime
  );
}

export function findRangeConflictInList(
  bookings,
  startHour,
  endHour,
  excludeId = null
) {
  return (bookings ?? []).find(
    (b) =>
      b.id !== excludeId &&
      hourRangeOverlapsBooking(b, startHour, endHour)
  );
}

/** Valid exclusive end hours after `startHour` (e.g. 6→9 allows 3-hour block). */
export function getValidEndHours(
  dateKey,
  startHour,
  slotHours,
  existingBookings = [],
  excludeId = null,
  now = new Date()
) {
  const start = Number(startHour);
  if (!Number.isFinite(start) || !slotHours?.length) return [];

  const maxEnd = Math.max(...slotHours) + 1;
  const valid = [];

  for (let end = start + 1; end <= maxEnd; end++) {
    if (!isRangeBookable(dateKey, start, end, now)) break;
    if (findRangeConflictInList(existingBookings, start, end, excludeId)) {
      break;
    }
    valid.push(end);
  }

  return valid;
}

/** Bookings that block the selected pitch (same rules as findBookingRangeConflict). */
export function filterBookingsForPitch(bookings, pitchId) {
  if (!pitchId) return [];
  const key = String(pitchId);
  return (bookings ?? []).filter(
    (booking) => booking.pitchId && String(booking.pitchId) === key
  );
}

/** Start hours with at least one bookable hour-long (or longer) range free. */
export function getAvailableStartHours(
  dateKey,
  slotHours,
  existingBookings = [],
  excludeId = null,
  now = new Date()
) {
  return (slotHours ?? []).filter((hour) => {
    if (!isSlotBookable(dateKey, hour, now)) return false;
    return (
      getValidEndHours(
        dateKey,
        hour,
        slotHours,
        existingBookings,
        excludeId,
        now
      ).length > 0
    );
  });
}

export function firstAvailableStartHour(
  dateKey,
  slotHours,
  existingBookings = [],
  excludeId = null,
  now = new Date()
) {
  const hour = getAvailableStartHours(
    dateKey,
    slotHours,
    existingBookings,
    excludeId,
    now
  )[0];
  return hour != null ? String(hour) : "";
}

export function formatEndHourLabel(endHour) {
  const { hour } = parseTimeField(`${endHour}:00`);
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString("en-LK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function isAdminRangeBookable(
  dateKey,
  startHour,
  endHour,
  existingBookings = [],
  now = new Date()
) {
  const start = Number(startHour);
  const end = Number(endHour);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return false;
  }
  if (!isRangeBookable(dateKey, start, end, now)) return false;
  if (findRangeConflictInList(existingBookings, start, end)) return false;
  return true;
}
