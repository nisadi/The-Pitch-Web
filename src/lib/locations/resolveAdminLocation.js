import {
  DEFAULT_ADMIN_SETTINGS,
} from "@/components/admin/settings/adminSettingsDefaults";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LOCATION_COLUMNS, locationFromRow } from "./locationMapper";
import {
  fetchOpenTimeMappings,
  fetchPeakTimeMappings,
} from "./locationTimeMapper";

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

/** Merge defaults when a location is missing expected fields. */
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
    // Time mappings: use whatever is already on the object (populated by fetch)
    openTimeMappings: location.openTimeMappings ?? [],
    peakTimeMappings: location.peakTimeMappings ?? [],
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

  let row = bySlug;

  if (!row) {
    const { data: byShort, error: shortError } = await supabase
      .from("locations")
      .select(LOCATION_COLUMNS)
      .eq("short_name", slugOrShortName)
      .maybeSingle();
    if (shortError) throw shortError;
    row = byShort;
  }

  if (!row) return null;

  const location = locationFromRow(row);
  if (!location?.dbId) return location;

  // Fetch time mappings for this single location
  const [openMappings, peakMappings] = await Promise.all([
    fetchOpenTimeMappings(location.dbId),
    fetchPeakTimeMappings(location.dbId),
  ]);
  location.openTimeMappings = openMappings;
  location.peakTimeMappings = peakMappings;

  return location;
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
