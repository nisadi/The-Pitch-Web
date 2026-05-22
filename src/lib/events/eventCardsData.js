import { createClient } from "@/lib/supabase/client";
import {
  EVENT_CARD_COLUMNS,
  buildEventCardsMap,
  eventCardToRow,
  normalizeEventCard,
} from "./eventCardsMapper";

export async function fetchEventCardsFromSupabase({ activeOnly = false } = {}) {
  const supabase = createClient();
  let query = supabase
    .from("events")
    .select(EVENT_CARD_COLUMNS)
    .order("sort_order");

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(normalizeEventCard).filter(Boolean);
}

export async function fetchEventCardsForPage() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_CARD_COLUMNS)
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw error;
    return buildEventCardsMap(data ?? []);
  } catch (err) {
    console.error("Failed to load event cards:", err);
    return buildEventCardsMap([]);
  }
}

export async function upsertEventCardClient(card) {
  const supabase = createClient();
  const row = eventCardToRow(card);

  if (card.dbId) {
    const { data, error } = await supabase
      .from("events")
      .update(row)
      .eq("id", card.dbId)
      .select(EVENT_CARD_COLUMNS)
      .single();
    if (error) throw error;
    return normalizeEventCard(data);
  }

  const { data, error } = await supabase
    .from("events")
    .upsert(row, { onConflict: "slug" })
    .select(EVENT_CARD_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeEventCard(data);
}
