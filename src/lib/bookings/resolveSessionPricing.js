import { getBookingStartHour } from "@/components/admin/bookingsUtils";
import { normalizeLocation } from "@/components/admin/settings/adminSettingsDefaults";
import { locationFromRow } from "@/lib/locations/locationMapper";
import { normalizePitch } from "@/lib/pitches/pitchMapper";
import { getBookingAmountBreakdown } from "./bookingPricing";

function normalizeLocationForPricing(location) {
  if (!location) return null;
  if (location.peakStart != null || location.peak_start != null) {
    if (location.peakStart != null) {
      return normalizeLocation(location);
    }
    return locationFromRow(location);
  }
  return locationFromRow(location) ?? normalizeLocation(location);
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
 */
export function resolveSessionPricing({
  location,
  pitch,
  slot,
  startHour,
  endHour,
}) {
  const hours = parseBookingSlotHours(slot, startHour, endHour);
  const loc = normalizeLocationForPricing(location);
  const p = normalizePitchForPricing(pitch);

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
  });

  return {
    ...hours,
    subtotal: breakdown.total,
    breakdown,
    rateLabel: formatSessionRateLabel(breakdown),
  };
}
