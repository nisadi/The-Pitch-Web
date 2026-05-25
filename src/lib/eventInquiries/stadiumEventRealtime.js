import { createClient } from "@/lib/supabase/client";
import {
  STADIUM_EVENT_COLUMNS,
  stadiumEventFromRow,
} from "./stadiumEventMapper";

const CHANNEL_PREFIX = "event-inquiries-admin";

let channelSeq = 0;
let activeTeardown = null;

function sortEventInquiries(list) {
  return [...list].sort((a, b) => {
    const aKey = `${a.date}T${a.time}`;
    const bKey = `${b.date}T${b.time}`;
    return bKey.localeCompare(aKey);
  });
}

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

export async function fetchEventInquiriesFromSupabase() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_inquiries")
    .select(STADIUM_EVENT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return sortEventInquiries(
    (data ?? []).map(stadiumEventFromRow).filter(Boolean)
  );
}

/**
 * Subscribe to event_inquiries postgres_changes.
 * Uses a fresh channel name each connect to avoid reuse-after-subscribe errors.
 */
export async function subscribeToEventInquiries(onChange, onReady) {
  const supabase = createClient();

  if (activeTeardown) {
    await activeTeardown();
    activeTeardown = null;
  }

  await removeChannelsForPrefix(supabase);

  const channelName = `${CHANNEL_PREFIX}-${++channelSeq}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "event_inquiries" },
      () => {
        onChange();
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.error("event_inquiries realtime error:", err);
      }
      if (status === "SUBSCRIBED") {
        onReady?.();
      }
      if (status === "CHANNEL_ERROR") {
        console.error(
          "Supabase realtime subscription failed for event_inquiries table"
        );
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

export function applyEventInquiryRealtimeEvent(inquiries, payload) {
  const event = payload.eventType;

  if (event === "DELETE") {
    const dbId = payload.old?.id;
    const reference = payload.old?.reference_code;
    return inquiries.filter(
      (item) => item.dbId !== dbId && item.id !== reference
    );
  }

  const inquiry = stadiumEventFromRow(payload.new);
  if (!inquiry?.id) return inquiries;

  const exists = inquiries.some(
    (item) => item.dbId === inquiry.dbId || item.id === inquiry.id
  );

  if (!exists) {
    return sortEventInquiries([inquiry, ...inquiries]);
  }

  return sortEventInquiries(
    inquiries.map((item) =>
      item.dbId === inquiry.dbId || item.id === inquiry.id ? inquiry : item
    )
  );
}
