import { createClient } from "@/lib/supabase/client";
import {
  EVENT_CARD_COLUMNS,
  buildEventCardsMap,
  normalizeEventCard,
} from "./eventCardsMapper";

const CHANNEL_PREFIX = "events-cards-realtime";

let channelSeq = 0;
let activeTeardown = null;

async function removeChannelsForPrefix(supabase) {
  const topicPrefix = `realtime:${CHANNEL_PREFIX}`;
  const existing = supabase
    .getChannels()
    .filter(
      (ch) =>
        ch.topic === topicPrefix || ch.topic?.startsWith(`${topicPrefix}-`)
    );
  await Promise.all(existing.map((ch) => supabase.removeChannel(ch)));
}

export async function subscribeToEventCards(onChange, onReady) {
  const supabase = createClient();

  if (activeTeardown) {
    await activeTeardown();
    activeTeardown = null;
  }

  await removeChannelsForPrefix(supabase);

  const channelName = `${CHANNEL_PREFIX}-${++channelSeq}`;
  const channel = supabase.channel(channelName);

  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "events" },
    () => {
      onChange();
    }
  );

  channel.subscribe((status, err) => {
    if (err) {
      console.error("events realtime error:", err);
    }
    if (status === "SUBSCRIBED") {
      onReady?.();
    }
    if (status === "CHANNEL_ERROR") {
      console.error("Supabase realtime subscription failed for events table");
    }
  });

  const teardown = async () => {
    await supabase.removeChannel(channel);
    if (activeTeardown === teardown) {
      activeTeardown = null;
    }
  };

  activeTeardown = teardown;
  return teardown;
}

export function applyEventCardRealtimeEvent(cards, payload) {
  const event = payload.eventType;

  if (event === "DELETE") {
    const dbId = payload.old?.id;
    return cards.filter((item) => item.dbId !== dbId);
  }

  const card = normalizeEventCard(payload.new);
  if (!card?.dbId) return cards;

  const exists = cards.some((item) => item.dbId === card.dbId);
  if (event === "INSERT" && !exists) {
    return [...cards, card].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
  }

  return cards
    .map((item) => (item.dbId === card.dbId ? card : item))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export async function reloadEventCardsMap() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_CARD_COLUMNS)
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return buildEventCardsMap(data ?? []);
}
