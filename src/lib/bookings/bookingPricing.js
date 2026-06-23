import { parseTimeField } from "@/components/admin/bookingsUtils";
import {
  getPeakSlotsForDay,
} from "@/lib/locations/locationTimeMapper";

function timeToMinutes(timeStr) {
  const { hour, minute } = parseTimeField(timeStr);
  return hour * 60 + minute;
}

/**
 * True when the hour slot starting at `hour` (e.g. 9 → 9:00–10:00) begins
 * inside the given time period [periodStart, periodEnd).
 */
export function isHourInTimePeriod(hour, periodStart, periodEnd) {
  const h = Number(hour);
  if (!Number.isFinite(h)) return false;
  const slotStart = h * 60;
  const start = timeToMinutes(periodStart);
  const end = timeToMinutes(periodEnd);
  return slotStart >= start && slotStart < end;
}

/**
 * True when the hour slot beginning at `hour` falls inside any of the given
 * time-period slots (used for multi-slot peak windows per day).
 *
 * @param {number} hour
 * @param {Array<{ startTime: string, endTime: string }>} slots
 */
export function isHourInAnyTimePeriod(hour, slots) {
  if (!slots?.length) return false;
  return slots.some((s) => isHourInTimePeriod(hour, s.startTime, s.endTime));
}

/**
 * Hourly rate for one booked slot, using the location's peak/non-peak windows
 * for the given day of the week (dateId: 0=Mon … 6=Sun).
 *
 * Peak wins over non-peak when a slot overlaps both (shouldn't happen with
 * valid settings, but peak takes precedence).
 *
 * Falls back to the non-peak rate when no peak window covers the slot.
 */
export function getHourlyRateForSlot(hour, location, pitchRates, dateId) {
  const peak = Number(pitchRates?.peakHourRate) || 0;
  const nonPeak = Number(pitchRates?.nonPeakHourRate) || 0;

  // New path: use per-day peak mappings
  if (location?.peakTimeMappings != null && dateId != null) {
    const peakSlots = getPeakSlotsForDay(location.peakTimeMappings, dateId);
    return isHourInAnyTimePeriod(hour, peakSlots) ? peak : nonPeak;
  }

  // Legacy fallback (should not be hit after the migration)
  const peakStart = location?.peakStart ?? "18:00";
  const peakEnd = location?.peakEnd ?? "22:00";
  if (isHourInTimePeriod(hour, peakStart, peakEnd)) return peak;
  return nonPeak;
}

/**
 * Sum rates for each hour from startHour (inclusive) to endHour (exclusive).
 *
 * @param {object} opts
 * @param {number}  opts.startHour
 * @param {number}  opts.endHour
 * @param {object}  opts.location         - normalised location with peakTimeMappings
 * @param {number}  opts.peakHourRate
 * @param {number}  opts.nonPeakHourRate
 * @param {number|null} opts.dateId       - 0=Mon … 6=Sun; null = use legacy flat fields
 */
export function calculateBookingTotalAmount({
  startHour,
  endHour,
  location,
  peakHourRate,
  nonPeakHourRate,
  dateId = null,
}) {
  const start = Number(startHour);
  const end = Number(endHour);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  const rates = { peakHourRate, nonPeakHourRate };
  let total = 0;
  for (let hour = Math.floor(start); hour < Math.ceil(end); hour += 1) {
    const overlap = Math.min(hour + 1, end) - Math.max(hour, start);
    if (overlap > 0) {
      total += getHourlyRateForSlot(hour, location, rates, dateId) * overlap;
    }
  }
  return Math.round(total);
}

/**
 * Per-hour breakdown for UI hints (peak / non-peak / other hour counts + totals).
 *
 * @param {object} opts — same as calculateBookingTotalAmount
 */
export function getBookingAmountBreakdown({
  startHour,
  endHour,
  location,
  peakHourRate,
  nonPeakHourRate,
  dateId = null,
}) {
  const start = Number(startHour);
  const end = Number(endHour);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return {
      total: 0,
      peakHours: 0,
      nonPeakHours: 0,
      otherHours: 0,
      peakRate: Number(peakHourRate) || 0,
      nonPeakRate: Number(nonPeakHourRate) || 0,
    };
  }

  const rates = { peakHourRate, nonPeakHourRate };
  const peakSlots =
    location?.peakTimeMappings != null && dateId != null
      ? getPeakSlotsForDay(location.peakTimeMappings, dateId)
      : null;

  // Legacy flat-field fallback
  const legacyPeakStart = location?.peakStart ?? "18:00";
  const legacyPeakEnd = location?.peakEnd ?? "22:00";
  const legacyNonPeakStart = location?.nonPeakStart ?? "06:00";
  const legacyNonPeakEnd = location?.nonPeakEnd ?? "12:00";

  let peakHours = 0;
  let nonPeakHours = 0;
  let otherHours = 0;

  for (let hour = Math.floor(start); hour < Math.ceil(end); hour += 1) {
    const overlap = Math.min(hour + 1, end) - Math.max(hour, start);
    if (overlap <= 0) continue;

    const isPeak =
      peakSlots != null
        ? isHourInAnyTimePeriod(hour, peakSlots)
        : isHourInTimePeriod(hour, legacyPeakStart, legacyPeakEnd);

    if (isPeak) {
      peakHours += overlap;
    } else if (
      peakSlots == null &&
      isHourInTimePeriod(hour, legacyNonPeakStart, legacyNonPeakEnd)
    ) {
      // Legacy non-peak bucket — only used when no mapping arrays are available
      nonPeakHours += overlap;
    } else {
      // In the new model everything that is not peak is treated as non-peak
      if (peakSlots != null) {
        nonPeakHours += overlap;
      } else {
        otherHours += overlap;
      }
    }
  }

  const peakRate = Number(peakHourRate) || 0;
  const nonPeakRate = Number(nonPeakHourRate) || 0;

  return {
    peakHours,
    nonPeakHours,
    otherHours,
    peakRate,
    nonPeakRate,
    total: calculateBookingTotalAmount({
      startHour,
      endHour,
      location,
      peakHourRate,
      nonPeakHourRate,
      dateId,
    }),
  };
}
