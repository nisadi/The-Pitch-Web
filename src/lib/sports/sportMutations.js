import { createClient } from "@/lib/supabase/client";
import { SPORT_COLUMNS, sportFromRow, sportToRow } from "./sportMapper";

export async function upsertSportClient(sport) {
  const supabase = createClient();
  const row = sportToRow(sport);

  if (sport.dbId) {
    const { data, error } = await supabase
      .from("sports")
      .update(row)
      .eq("id", sport.dbId)
      .select(SPORT_COLUMNS)
      .single();

    if (error) throw error;
    return sportFromRow(data);
  }

  const { data, error } = await supabase
    .from("sports")
    .insert(row)
    .select(SPORT_COLUMNS)
    .single();

  if (error) throw error;
  return sportFromRow(data);
}

export async function deleteSportClient(sport) {
  const supabase = createClient();
  const id = sport.dbId ?? sport.id;

  if (!id) return;

  const { error } = await supabase.from("sports").delete().eq("id", id);
  if (error) throw error;
}
