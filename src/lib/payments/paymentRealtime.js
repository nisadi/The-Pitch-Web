import { createClient } from "@/lib/supabase/client";
import { PAYMENT_SELECT, paymentFromRow } from "./paymentMapper";

const CHANNEL_NAME = "payments-admin";

const REALTIME_TABLES = ["payments", "bookings", "users"];

function sortPayments(list) {
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

export async function fetchPaymentsFromSupabase() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(PAYMENT_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return sortPayments((data ?? []).map(paymentFromRow).filter(Boolean));
}

/**
 * Subscribe to payments, bookings, and users changes. Joined rows are re-fetched
 * after each event so customer/venue/booking fields stay in sync.
 */
export async function subscribeToPayments(onChange, onReady) {
  const supabase = createClient();

  await removeExistingChannels(supabase, CHANNEL_NAME);

  const channel = supabase.channel(CHANNEL_NAME);

  for (const table of REALTIME_TABLES) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => {
        onChange();
      }
    );
  }

  channel.subscribe((status, err) => {
    if (err) {
      console.error("payments realtime error:", err);
    }
    if (status === "SUBSCRIBED") {
      onReady?.();
    }
    if (status === "CHANNEL_ERROR") {
      console.error(
        "Supabase realtime subscription failed for payments/bookings/users"
      );
    }
  });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function applyPaymentRealtimeEvent(payments, payload) {
  const event = payload.eventType;

  if (event === "DELETE") {
    const dbId = payload.old?.id;
    return payments.filter((item) => item.dbId !== dbId);
  }

  const payment = paymentFromRow(payload.new);
  if (!payment?.dbId) return payments;

  const exists = payments.some((item) => item.dbId === payment.dbId);

  if (!exists) {
    return sortPayments([payment, ...payments]);
  }

  return sortPayments(
    payments.map((item) => (item.dbId === payment.dbId ? payment : item))
  );
}
