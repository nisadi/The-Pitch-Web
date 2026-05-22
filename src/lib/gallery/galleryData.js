import { createClient } from "@/lib/supabase/client";
import { galleryFromRow } from "./galleryMapper";

function sortGallery(list) {
  return [...list].sort((a, b) => {
    const order = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (order !== 0) return order;
    return (a.title ?? "").localeCompare(b.title ?? "");
  });
}

export async function fetchGalleryFromSupabase({ activeOnly = false } = {}) {
  const supabase = createClient();
  let query = supabase.from("gallery").select("*");

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) throw error;

  return sortGallery((data ?? []).map(galleryFromRow).filter(Boolean));
}

export function subscribeToGallery(onPayload) {
  const supabase = createClient();

  const channel = supabase
    .channel("gallery-table-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "gallery" },
      onPayload
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error("Supabase realtime subscription failed for gallery table");
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function applyGalleryRealtimeEvent(items, payload) {
  const event = payload.eventType;

  if (event === "DELETE") {
    const dbId = payload.old?.id;
    return items.filter((item) => item.dbId !== dbId && item.id !== dbId);
  }

  const entry = galleryFromRow(payload.new);
  if (!entry?.id) return items;

  const exists = items.some(
    (item) => item.dbId === entry.dbId || item.id === entry.id
  );

  if (event === "INSERT" && !exists) {
    return sortGallery([...items, entry]);
  }

  return sortGallery(
    items.map((item) =>
      item.dbId === entry.dbId || item.id === entry.id ? entry : item
    )
  );
}
