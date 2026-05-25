import {
  DEFAULT_ADMIN_SETTINGS,
  DEFAULT_NON_PEAK_END,
  DEFAULT_NON_PEAK_START,
  DEFAULT_PEAK_END,
  DEFAULT_PEAK_START,
} from "@/components/admin/settings/adminSettingsDefaults";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LOCATION_COLUMNS, locationFromRow } from "./locationMapper";

export function findLocationInList(locations, { locationId, filterValue }) {
  if (!locations?.length) return null;

  const byId = locations.find((loc) => loc.id === locationId);
  if (byId) return byId;

  return (
    locations.find(
      (loc) =>
        loc.shortName === filterValue ||
        loc.shortName === locationId ||
        loc.id === filterValue
    ) ?? null
  );
}

/** Merge defaults when Supabase row is missing sport_ids or hours. */
export function enrichLocationWithDefaults(location) {
  if (!location) return null;

  const defaults = DEFAULT_ADMIN_SETTINGS.locations.find(
    (item) => item.id === location.id
  );

  return {
    ...location,
    dbId: location.dbId ?? null,
    sportIds:
      location.sportIds?.length > 0
        ? location.sportIds
        : (defaults?.sportIds ?? []),
    operationalStart:
      location.operationalStart || defaults?.operationalStart || "08:00",
    operationalEnd:
      location.operationalEnd || defaults?.operationalEnd || "21:00",
    nonPeakStart:
      location.nonPeakStart || defaults?.nonPeakStart || DEFAULT_NON_PEAK_START,
    nonPeakEnd:
      location.nonPeakEnd || defaults?.nonPeakEnd || DEFAULT_NON_PEAK_END,
    peakStart: location.peakStart || defaults?.peakStart || DEFAULT_PEAK_START,
    peakEnd: location.peakEnd || defaults?.peakEnd || DEFAULT_PEAK_END,
  };
}

export async function fetchLocationFromSupabase(slugOrShortName) {
  if (!isSupabaseConfigured() || !slugOrShortName) return null;

  const supabase = createClient();
  const { data: bySlug, error: slugError } = await supabase
    .from("locations")
    .select(LOCATION_COLUMNS)
    .eq("slug", slugOrShortName)
    .maybeSingle();

  if (slugError) throw slugError;
  if (bySlug) return locationFromRow(bySlug);

  const { data: byShort, error: shortError } = await supabase
    .from("locations")
    .select(LOCATION_COLUMNS)
    .eq("short_name", slugOrShortName)
    .maybeSingle();

  if (shortError) throw shortError;
  return locationFromRow(byShort);
}

export async function resolveCalendarLocation(locations, { locationId, filterValue }) {
  const base = findLocationInList(locations, { locationId, filterValue });
  if (!base) return null;

  let enriched = enrichLocationWithDefaults(base);
  if (enriched.dbId) return enriched;

  try {
    const remote = await fetchLocationFromSupabase(
      base.id ?? filterValue ?? locationId
    );
    if (remote) {
      enriched = enrichLocationWithDefaults({ ...base, ...remote });
    }
  } catch (err) {
    console.error("[resolveCalendarLocation]", err);
  }

  return enriched;
}
