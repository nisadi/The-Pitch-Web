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

function pitchDeleteErrorMessage(error) {
  if (error?.code === "23503") {
    return "This pitch cannot be deleted because it is linked to existing bookings.";
  }
  return error?.message ?? "Could not delete pitch.";
}

export async function deletePitchClient(pitch) {
  const supabase = createClient();
  const id = pitch.dbId ?? pitch.id;

  if (!id) {
    throw new Error("This pitch is not saved in the database yet.");
  }

  const { error } = await supabase.from("pitches").delete().eq("id", id);
  if (error) {
    throw new Error(pitchDeleteErrorMessage(error));
  }
}
