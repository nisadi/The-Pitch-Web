import { createClient } from "@/lib/supabase/client";
import {
  LOCATION_COLUMNS,
  locationFromRow,
  locationToRow,
} from "./locationMapper";

function locationDeleteKeys(location) {
  return new Set(
    [location.id, location.dbId, location.slug, location.shortName]
      .filter(Boolean)
      .map(String)
  );
}

async function removeLocationFromPromos(supabase, location) {
  const keys = locationDeleteKeys(location);
  if (!keys.size) return;

  const { data: promos, error: fetchError } = await supabase
    .from("promo_codes")
    .select("id, location_ids");

  if (fetchError) throw fetchError;

  const updates = (promos ?? []).flatMap((promo) => {
    const current = Array.isArray(promo.location_ids) ? promo.location_ids : [];
    const next = current.filter((id) => !keys.has(String(id)));
    if (next.length === current.length) return [];
    return [{ id: promo.id, location_ids: next }];
  });

  for (const row of updates) {
    const { error } = await supabase
      .from("promo_codes")
      .update({ location_ids: row.location_ids })
      .eq("id", row.id);
    if (error) throw error;
  }
}

function locationDeleteErrorMessage(error) {
  if (error?.code === "23503") {
    return "This location cannot be deleted because it is still linked to other records.";
  }
  return error?.message ?? "Could not delete location.";
}

export async function upsertLocationClient(location) {
  const supabase = createClient();
  const row = locationToRow(location);

  if (location.dbId) {
    const { data, error } = await supabase
      .from("locations")
      .update(row)
      .eq("id", location.dbId)
      .select(LOCATION_COLUMNS)
      .single();

    if (error) throw error;
    return locationFromRow(data);
  }

  const { data, error } = await supabase
    .from("locations")
    .insert(row)
    .select(LOCATION_COLUMNS)
    .single();

  if (error) throw error;
  return locationFromRow(data);
}

export async function deleteLocationClient(location) {
  const supabase = createClient();

  await removeLocationFromPromos(supabase, location);

  if (location.dbId) {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", location.dbId);
    if (error) throw new Error(locationDeleteErrorMessage(error));
    return;
  }

  if (location.id) {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("slug", location.id);
    if (error) throw new Error(locationDeleteErrorMessage(error));
  }
}
