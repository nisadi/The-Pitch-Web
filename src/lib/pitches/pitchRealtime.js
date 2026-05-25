import { createClient } from "@/lib/supabase/client";
import { PITCH_COLUMNS, pitchFromRow } from "./pitchMapper";

function sortPitches(list) {
  return [...list].sort((a, b) => {
    const loc = (a.locationName || "").localeCompare(b.locationName || "");
    if (loc !== 0) return loc;
    return a.name.localeCompare(b.name);
  });
}

export async function fetchPitchesFromSupabase() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pitches")
    .select(PITCH_COLUMNS)
    .order("name");

  if (error) throw error;

  return sortPitches((data ?? []).map(pitchFromRow).filter(Boolean));
}

export function subscribeToPitches(onPayload) {
  const supabase = createClient();

  const channel = supabase
    .channel("pitches-table-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "pitches" },
      onPayload
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error(
          "Supabase realtime subscription failed for pitches table"
        );
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function applyPitchRealtimeEvent(pitches, payload) {
  const event = payload.eventType;

  if (event === "DELETE") {
    const dbId = payload.old?.id;
    return pitches.filter((item) => item.dbId !== dbId && item.id !== dbId);
  }

  const mapped = pitchFromRow(payload.new);
  if (!mapped?.id) return pitches;

  const exists = pitches.some(
    (item) => item.dbId === mapped.dbId || item.id === mapped.id
  );

  if (event === "INSERT" && !exists) {
    return sortPitches([...pitches, mapped]);
  }

  return sortPitches(
    pitches.map((item) =>
      item.dbId === mapped.dbId || item.id === mapped.id ? mapped : item
    )
  );
}
