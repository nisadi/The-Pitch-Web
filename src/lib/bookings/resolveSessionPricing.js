import { getBookingStartHour } from "@/components/admin/bookingsUtils";
import { normalizeLocation } from "@/components/admin/settings/adminSettingsDefaults";
import { locationFromRow } from "@/lib/locations/locationMapper";
import { dateKeyToDateId } from "@/lib/locations/locationTimeMapper";
import { normalizePitch } from "@/lib/pitches/pitchMapper";
import { getBookingAmountBreakdown } from "./bookingPricing";

function normalizeLocationForPricing(location) {
  if (!location) return null;
  if (location.peakTimeMappings != null || location.openTimeMappings != null) {
    // Already in the new format
    return location;
  }
  // Legacy: row might have the old flat fields
  if (location.peak_start != null) {
    return locationFromRow(location);
  }
  return normalizeLocation(location);
}

function normalizePitchForPricing(pitch) {
  if (!pitch) return null;
  return normalizePitch(pitch);
}

/** Resolve start/end hour from slot label or explicit values (each slot is one hour). */
export function parseBookingSlotHours(slotLabel, startHour, endHour) {
  if (
    Number.isFinite(Number(startHour)) &&
    Number.isFinite(Number(endHour)) &&
    Number(endHour) > Number(startHour)
  ) {
    return { startHour: Number(startHour), endHour: Number(endHour) };
  }

  const start = getBookingStartHour({ time: slotLabel ?? "" });
  return { startHour: start, endHour: start + 1 };
}

export function formatSessionRateLabel(breakdown) {
  if (!breakdown || breakdown.total <= 0) {
    return "Standard Rate";
  }

  const parts = [];
  if (breakdown.peakHours > 0) {
    parts.push(
      `Peak LKR ${breakdown.peakRate.toLocaleString("en-LK")}/hr`
    );
  }
  if (breakdown.nonPeakHours > 0) {
    parts.push(
      `Off-peak LKR ${breakdown.nonPeakRate.toLocaleString("en-LK")}/hr`
    );
  }
  if (breakdown.otherHours > 0) {
    parts.push(
      `${breakdown.otherHours} hr at off-peak rate`
    );
  }

  return parts.join(" · ") || "Standard Rate";
}

/**
 * Session fee from pitch peak/off-peak rates and location time windows.
 *
 * @param {object} opts
 * @param {object} opts.location    - normalised location with peakTimeMappings
 * @param {object} opts.pitch
 * @param {string} opts.slot        - slot label string (fallback if start/endHour absent)
 * @param {number} opts.startHour
 * @param {number} opts.endHour
 * @param {string|null} opts.bookingDate  - "YYYY-MM-DD" used to derive dateId
 */
export function resolveSessionPricing({
  location,
  pitch,
  slot,
  startHour,
  endHour,
  bookingDate = null,
}) {
  const hours = parseBookingSlotHours(slot, startHour, endHour);
  const loc = normalizeLocationForPricing(location);
  const p = normalizePitchForPricing(pitch);

  // Derive dateId from the booking date for day-specific peak windows
  const dateId = bookingDate ? dateKeyToDateId(bookingDate) : null;

  if (!loc || !p) {
    return {
      ...hours,
      subtotal: 0,
      breakdown: null,
      rateLabel: "Standard Rate",
    };
  }

  const breakdown = getBookingAmountBreakdown({
    startHour: hours.startHour,
    endHour: hours.endHour,
    location: loc,
    peakHourRate: p.peakHourRate,
    nonPeakHourRate: p.nonPeakHourRate,
    dateId,
  });

  return {
    ...hours,
    subtotal: breakdown.total,
    breakdown,
    rateLabel: formatSessionRateLabel(breakdown),
  };
}
