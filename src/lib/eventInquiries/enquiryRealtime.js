import { createClient } from "@/lib/supabase/client";
import { ENQUIRY_COLUMNS, enquiryFromRow } from "./enquiryMapper";

const CHANNEL_NAME = "contact-messages-admin";

function sortEnquiries(list) {
  return [...list].sort((a, b) => {
    const aKey = `${a.date}T${a.time}`;
    const bKey = `${b.date}T${b.time}`;
    return bKey.localeCompare(aKey);
  });
}

async function removeExistingChannels(supabase, channelName) {
  const topic = `realtime:${channelName}`;
  const existing = supabase.getChannels().filter((ch) => ch.topic === topic);
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
 * Waits for any prior channel with the same name to be removed first.
 */
export async function subscribeToEnquiries(onPayload, onReady) {
  const supabase = createClient();

  await removeExistingChannels(supabase, CHANNEL_NAME);

  const channel = supabase.channel(CHANNEL_NAME);

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

  return () => {
    void supabase.removeChannel(channel);
  };
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
