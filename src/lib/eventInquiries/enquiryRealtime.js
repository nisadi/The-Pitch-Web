import { createClient } from "@/lib/supabase/client";
import { ENQUIRY_COLUMNS, enquiryFromRow } from "./enquiryMapper";

const CHANNEL_PREFIX = "contact-messages-admin";

let channelSeq = 0;
let activeTeardown = null;

function sortEnquiries(list) {
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

export async function fetchEnquiriesFromSupabase() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select(ENQUIRY_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return sortEnquiries((data ?? []).map(enquiryFromRow).filter(Boolean));
}

/**
 * Subscribe to contact_messages via Supabase Realtime postgres_changes.
 * Uses a fresh channel name each connect to avoid reuse-after-subscribe errors.
 */
export async function subscribeToEnquiries(onPayload, onReady) {
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
    { event: "*", schema: "public", table: "contact_messages" },
    (payload) => {
      onPayload(payload);
    }
  );

  channel.subscribe((status, err) => {
    if (err) {
      console.error("contact_messages realtime error:", err);
    }
    if (status === "SUBSCRIBED") {
      onReady?.();
    }
    if (status === "CHANNEL_ERROR") {
      console.error(
        "Supabase realtime subscription failed for contact_messages table"
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

export function applyEnquiryRealtimeEvent(enquiries, payload) {
  const event = payload.eventType;

  if (event === "DELETE") {
    const dbId = payload.old?.id;
    const reference = payload.old?.reference_code;
    return enquiries.filter(
      (item) => item.dbId !== dbId && item.id !== reference
    );
  }

  const enquiry = enquiryFromRow(payload.new);
  if (!enquiry?.id) return enquiries;

  const exists = enquiries.some(
    (item) => item.dbId === enquiry.dbId || item.id === enquiry.id
  );

  if (!exists) {
    return sortEnquiries([enquiry, ...enquiries]);
  }

  return sortEnquiries(
    enquiries.map((item) =>
      item.dbId === enquiry.dbId || item.id === enquiry.id ? enquiry : item
    )
  );
}
