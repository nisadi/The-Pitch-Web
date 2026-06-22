import { parseTimeField } from "@/components/admin/bookingsUtils";
import {
  DEFAULT_NON_PEAK_END,
  DEFAULT_NON_PEAK_START,
  DEFAULT_PEAK_END,
  DEFAULT_PEAK_START,
} from "@/components/admin/settings/adminSettingsDefaults";

function timeToMinutes(timeStr) {
  const { hour, minute } = parseTimeField(timeStr);
  return hour * 60 + minute;
}

/** True when the hour slot starting at `hour` (e.g. 9 → 9:00–10:00) begins inside the period. */
export function isHourInTimePeriod(hour, periodStart, periodEnd) {
  const h = Number(hour);
  if (!Number.isFinite(h)) return false;
  const slotStart = h * 60;
  const start = timeToMinutes(periodStart);
  const end = timeToMinutes(periodEnd);
  return slotStart >= start && slotStart < end;
}

/**
 * Hourly rate for one booked slot using location peak/non-peak windows and pitch rates.
 * Peak window wins if a slot overlaps both (should not happen when settings are valid).
 */
export function getHourlyRateForSlot(hour, location, pitchRates) {
  const peak = Number(pitchRates?.peakHourRate) || 0;
  const nonPeak = Number(pitchRates?.nonPeakHourRate) || 0;

  const peakStart = location?.peakStart ?? DEFAULT_PEAK_START;
  const peakEnd = location?.peakEnd ?? DEFAULT_PEAK_END;
  const nonPeakStart = location?.nonPeakStart ?? DEFAULT_NON_PEAK_START;
  const nonPeakEnd = location?.nonPeakEnd ?? DEFAULT_NON_PEAK_END;

  if (isHourInTimePeriod(hour, peakStart, peakEnd)) return peak;
  if (isHourInTimePeriod(hour, nonPeakStart, nonPeakEnd)) return nonPeak;
  return nonPeak;
}

/** Sum rates for each hour from startHour inclusive to endHour exclusive. */
export function calculateBookingTotalAmount({
  startHour,
  endHour,
  location,
  peakHourRate,
  nonPeakHourRate,
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
      total += getHourlyRateForSlot(hour, location, rates) * overlap;
    }
  }
  return Math.round(total);
}

/** Per-hour breakdown for UI hints. */
export function getBookingAmountBreakdown({
  startHour,
  endHour,
  location,
  peakHourRate,
  nonPeakHourRate,
}) {
  const start = Number(startHour);
  const end = Number(endHour);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { total: 0, peakHours: 0, nonPeakHours: 0, otherHours: 0 };
  }

  const rates = { peakHourRate, nonPeakHourRate };
  const peakStart = location?.peakStart ?? DEFAULT_PEAK_START;
  const peakEnd = location?.peakEnd ?? DEFAULT_PEAK_END;
  const nonPeakStart = location?.nonPeakStart ?? DEFAULT_NON_PEAK_START;
  const nonPeakEnd = location?.nonPeakEnd ?? DEFAULT_NON_PEAK_END;

  let peakHours = 0;
  let nonPeakHours = 0;
  let otherHours = 0;

  for (let hour = Math.floor(start); hour < Math.ceil(end); hour += 1) {
    const overlap = Math.min(hour + 1, end) - Math.max(hour, start);
    if (overlap > 0) {
      if (isHourInTimePeriod(hour, peakStart, peakEnd)) {
        peakHours += overlap;
      } else if (isHourInTimePeriod(hour, nonPeakStart, nonPeakEnd)) {
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
    }),
  };
}
