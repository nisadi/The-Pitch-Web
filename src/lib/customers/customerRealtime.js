import { createClient } from "@/lib/supabase/client";
import { CUSTOMER_SELECT, customerFromRow } from "./customerMapper";

const CHANNEL_NAME = "customers-admin";

const REALTIME_TABLES = ["users", "bookings", "payments"];

function sortCustomers(list) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

async function removeExistingChannels(supabase, channelName) {
  const topic = `realtime:${channelName}`;
  const existing = supabase.getChannels().filter((ch) => ch.topic === topic);
  await Promise.all(existing.map((ch) => supabase.removeChannel(ch)));
}

export async function fetchCustomersFromSupabase() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select(CUSTOMER_SELECT)
    .eq("role", "user")
    .order("full_name");

  if (error) throw error;

  return sortCustomers((data ?? []).map(customerFromRow).filter(Boolean));
}

/**
 * Subscribe to users, bookings, and payments. Re-fetches joined aggregates on change.
 */
export async function subscribeToCustomers(onChange, onReady) {
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
      console.error("customers realtime error:", err);
    }
    if (status === "SUBSCRIBED") {
      onReady?.();
    }
    if (status === "CHANNEL_ERROR") {
      console.error(
        "Supabase realtime subscription failed for users/bookings/payments"
      );
    }
  });

  return () => {
    void supabase.removeChannel(channel);
  };
}
