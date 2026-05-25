import { supabase } from "@/lib/supabase";
import { pitchFromRow } from "@/lib/pitches/pitchMapper";

export async function getPitches() {
  const { data, error } = await supabase
    .from("pitches")
    .select(
      "id, location_id, sport_id, sport_ids, name, peak_hour_rate, non_peak_hour_rate, is_active"
    )
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("[getPitches]", error);
    return [];
  }

  return (data ?? []).map(pitchFromRow).filter(Boolean);
}
