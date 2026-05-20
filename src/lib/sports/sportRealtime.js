import { createClient } from "@/lib/supabase/client";
import { SPORT_COLUMNS, sportFromRow } from "./sportMapper";

function sortSports(list) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchSportsFromSupabase() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sports")
    .select(SPORT_COLUMNS)
    .order("name");

  if (error) throw error;

  return sortSports((data ?? []).map(sportFromRow).filter(Boolean));
}

export function subscribeToSports(onPayload) {
  const supabase = createClient();

  const channel = supabase
    .channel("sports-table-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sports" },
      onPayload
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error("Supabase realtime subscription failed for sports table");
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function applySportRealtimeEvent(sports, payload) {
  const event = payload.eventType;

  if (event === "DELETE") {
    const dbId = payload.old?.id;
    return sports.filter((item) => item.dbId !== dbId && item.id !== dbId);
  }

  const sport = sportFromRow(payload.new);
  if (!sport?.id) return sports;

  const exists = sports.some(
    (item) => item.dbId === sport.dbId || item.id === sport.id
  );

  if (event === "INSERT" && !exists) {
    return sortSports([...sports, sport]);
  }

  return sortSports(
    sports.map((item) =>
      item.dbId === sport.dbId || item.id === sport.id ? sport : item
    )
  );
}
