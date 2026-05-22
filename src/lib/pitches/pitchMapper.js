import { isUuid } from "@/lib/bookings/bookingMutations";

export const PITCH_COLUMNS = `
  id,
  location_id,
  sport_id,
  sport_ids,
  name,
  price_per_hour,
  peak_hour_rate,
  non_peak_hour_rate,
  is_active,
  created_at,
  locations ( id, name, short_name ),
  sports ( id, name )
`;

function normalizeSportIds(pitch) {
  if (Array.isArray(pitch.sportIds) && pitch.sportIds.length > 0) {
    return pitch.sportIds.map(String);
  }
  if (Array.isArray(pitch.sport_ids) && pitch.sport_ids.length > 0) {
    return pitch.sport_ids.map(String);
  }
  const single = pitch.sportId ?? pitch.sport_id;
  return single ? [String(single)] : [];
}

function normalizeUuid(value) {
  return value == null ? "" : String(value).trim().toLowerCase();
}

function sportMatchKeys(sportId, sportMeta) {
  const keys = new Set();
  const add = (value) => {
    if (value == null || value === "") return;
    keys.add(normalizeUuid(value));
    keys.add(String(value).trim().toLowerCase());
  };
  add(sportId);
  if (sportMeta) {
    add(sportMeta.dbId);
    add(sportMeta.id);
    add(sportMeta.slug);
  }
  return keys;
}

export function pitchSupportsSport(pitch, sportId, sportMeta = null) {
  const keys = sportMatchKeys(sportId, sportMeta);
  if (!keys.size) return false;

  for (const raw of normalizeSportIds(pitch)) {
    const normalized = normalizeUuid(raw);
    const lower = String(raw).trim().toLowerCase();
    if (keys.has(normalized) || keys.has(lower)) return true;
  }

  const legacy = pitch.sportId ?? pitch.sport_id;
  if (legacy == null) return false;
  const legacyNorm = normalizeUuid(legacy);
  const legacyLower = String(legacy).trim().toLowerCase();
  return keys.has(legacyNorm) || keys.has(legacyLower);
}

export function pitchMatchesLocation(pitch, location) {
  if (!location) return false;
  const pitchLoc = pitch.locationId ?? pitch.location_id;
  if (!pitchLoc) return false;

  const dbId = location.dbId ?? location.db_id;
  if (dbId && normalizeUuid(pitchLoc) === normalizeUuid(dbId)) return true;

  return false;
}

/** Pitches at a location that support the given sport (active only). */
export function filterPitchesForBooking(
  pitches,
  location,
  sportId,
  sportMeta = null
) {
  const hasLocation =
    location?.dbId ?? location?.db_id ?? location?.id ?? location?.shortName;
  if (!hasLocation || !sportId) return [];

  return (pitches ?? []).filter(
    (pitch) =>
      pitchMatchesLocation(pitch, location) &&
      pitch.status !== "inactive" &&
      pitchSupportsSport(pitch, sportId, sportMeta)
  );
}

export function normalizePitch(pitch) {
  const dbId = pitch.dbId ?? pitch.db_id ?? null;
  const id = dbId ? String(dbId) : String(pitch.id ?? "");
  const sportIds = normalizeSportIds(pitch);

  const peak =
    Number(pitch.peakHourRate ?? pitch.peak_hour_rate ?? pitch.price_per_hour) ||
    0;
  const nonPeak =
    Number(
      pitch.nonPeakHourRate ??
        pitch.non_peak_hour_rate ??
        pitch.peak_hour_rate ??
        pitch.price_per_hour
    ) || 0;

  return {
    id,
    dbId,
    name: pitch.name ?? "",
    locationId: pitch.locationId ?? pitch.location_id ?? "",
    sportIds,
    sportId: sportIds[0] ?? pitch.sportId ?? pitch.sport_id ?? "",
    peakHourRate: peak,
    nonPeakHourRate: nonPeak,
    /** @deprecated use peakHourRate — kept for legacy reads */
    pricePerHour: peak,
    status: pitch.status ?? (pitch.is_active === false ? "inactive" : "active"),
    locationName:
      pitch.locationName ??
      pitch.location_short_name ??
      pitch.locations?.short_name ??
      pitch.locations?.name ??
      "",
    sportName: pitch.sportName ?? pitch.sports?.name ?? "",
  };
}

export function pitchFromRow(row) {
  if (!row?.id) return null;

  return normalizePitch({
    id: row.id,
    dbId: row.id,
    name: row.name,
    location_id: row.location_id,
    sport_id: row.sport_id,
    sport_ids: row.sport_ids,
    price_per_hour: row.price_per_hour,
    peak_hour_rate: row.peak_hour_rate,
    non_peak_hour_rate: row.non_peak_hour_rate,
    is_active: row.is_active,
    locations: row.locations,
    sports: row.sports,
  });
}

export function pitchToRow(pitch) {
  const peak = Number(pitch.peakHourRate) || 0;
  const nonPeak = Number(pitch.nonPeakHourRate) || 0;
  const sportIds = normalizeSportIds(pitch).filter((id) => isUuid(id));

  if (!sportIds.length) {
    throw new Error(
      "At least one sport with a valid database ID is required. Re-select sports in the pitch form."
    );
  }

  const primarySportId = sportIds[0];

  return {
    name: pitch.name?.trim(),
    location_id: pitch.locationId,
    sport_ids: sportIds,
    sport_id: primarySportId,
    peak_hour_rate: peak,
    non_peak_hour_rate: nonPeak,
    price_per_hour: peak,
    is_active: pitch.status !== "inactive",
  };
}
