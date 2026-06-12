import { DEFAULT_ADMIN_SETTINGS } from "@/components/admin/settings/adminSettingsDefaults";

function normalizeId(value) {
  return value == null ? "" : String(value).trim();
}

function normalizeKey(value) {
  return normalizeId(value).toLowerCase();
}

/** Sport ids configured on a location row (Supabase or admin shape). */
export function getLocationSportIds(location) {
  if (!location) return [];

  const fromRow = location.sport_ids ?? location.sportIds ?? [];
  if (Array.isArray(fromRow) && fromRow.length > 0) {
    return fromRow.map(normalizeId).filter(Boolean);
  }

  const slug = location.slug ?? location.short_name ?? location.shortName;
  const defaults = DEFAULT_ADMIN_SETTINGS.locations.find(
    (item) =>
      item.id === slug ||
      normalizeKey(item.shortName) === normalizeKey(location.short_name) ||
      normalizeKey(item.name) === normalizeKey(location.name)
  );

  return (defaults?.sportIds ?? []).map(normalizeId).filter(Boolean);
}

export function sportIsAvailableAtLocation(sport, locationSportIds) {
  if (!locationSportIds.length) return true;

  const sportKeys = new Set(
    [sport.id, sport.slug, sport.dbId, sport.db_id]
      .map(normalizeKey)
      .filter(Boolean)
  );

  return locationSportIds.some((id) => sportKeys.has(normalizeKey(id)));
}

export function filterSportsForLocation(sports, location) {
  const locationSportIds = getLocationSportIds(location);
  if (!locationSportIds.length) return sports ?? [];
  return (sports ?? []).filter((sport) =>
    sportIsAvailableAtLocation(sport, locationSportIds)
  );
}
