import { createClient } from "@/lib/supabase/client";
import { PITCH_COLUMNS, pitchFromRow, pitchToRow } from "./pitchMapper";

export async function upsertPitchClient(pitch) {
  const supabase = createClient();
  const row = pitchToRow(pitch);

  if (!row.location_id) {
    throw new Error("Location is required to save a pitch.");
  }

  if (pitch.dbId) {
    const { data, error } = await supabase
      .from("pitches")
      .update(row)
      .eq("id", pitch.dbId)
      .select(PITCH_COLUMNS)
      .single();

    if (error) throw error;
    return pitchFromRow(data);
  }

  const { data, error } = await supabase
    .from("pitches")
    .insert(row)
    .select(PITCH_COLUMNS)
    .single();

  if (error) throw error;
  return pitchFromRow(data);
}

export async function deletePitchClient(pitch) {
  const supabase = createClient();
  const id = pitch.dbId ?? pitch.id;

  if (!id) return;

  const { error } = await supabase.from("pitches").delete().eq("id", id);
  if (error) throw error;
}
