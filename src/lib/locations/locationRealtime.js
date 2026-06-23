import { createClient } from "@/lib/supabase/client";
import { LOCATION_COLUMNS, locationFromRow } from "./locationMapper";
import {
  fetchOpenTimeMappingsBatch,
  fetchPeakTimeMappingsBatch,
} from "./locationTimeMapper";

function sortLocations(list) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchLocationsFromSupabase() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("locations")
    .select(LOCATION_COLUMNS)
    .order("name");

  if (error) throw error;

  const locations = (data ?? []).map(locationFromRow).filter(Boolean);

  // Batch-fetch time mappings to avoid N+1 queries
  if (locations.length) {
    const dbIds = locations.map((l) => l.dbId).filter(Boolean);
    const [openMap, peakMap] = await Promise.all([
      fetchOpenTimeMappingsBatch(dbIds),
      fetchPeakTimeMappingsBatch(dbIds),
    ]);
    for (const loc of locations) {
      loc.openTimeMappings = openMap[loc.dbId] ?? [];
      loc.peakTimeMappings = peakMap[loc.dbId] ?? [];
    }
  }

  return sortLocations(locations);
}

export function subscribeToLocations(onPayload) {
  const supabase = createClient();

  const channel = supabase
    .channel("locations-table-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "locations" },
      onPayload
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error(
          "Supabase realtime subscription failed for locations table"
        );
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function applyLocationRealtimeEvent(locations, payload) {
  const event = payload.eventType;

  if (event === "DELETE") {
    const dbId = payload.old?.id;
    const slug = payload.old?.slug;
    return locations.filter(
      (loc) => loc.dbId !== dbId && loc.id !== slug
    );
  }

  const location = locationFromRow(payload.new);
  if (!location?.id) return locations;

  const exists = locations.some(
    (item) => item.dbId === location.dbId || item.id === location.id
  );

  // Preserve time mappings from the existing record on realtime events —
  // the postgres_changes payload does not include child-table rows.
  const existing = locations.find(
    (item) => item.dbId === location.dbId || item.id === location.id
  );
  location.openTimeMappings = existing?.openTimeMappings ?? [];
  location.peakTimeMappings = existing?.peakTimeMappings ?? [];

  if (event === "INSERT" && !exists) {
    return sortLocations([...locations, location]);
  }

  return sortLocations(
    locations.map((item) =>
      item.dbId === location.dbId || item.id === location.id ? location : item
    )
  );
}
