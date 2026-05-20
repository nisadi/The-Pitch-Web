import { createClient } from "@/lib/supabase/client";
import {
  LOCATION_COLUMNS,
  locationFromRow,
  locationToRow,
} from "./locationMapper";

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

  if (location.dbId) {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", location.dbId);
    if (error) throw error;
    return;
  }

  if (location.id) {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("slug", location.id);
    if (error) throw error;
  }
}
