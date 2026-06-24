import { createClient } from "@/lib/supabase/client";
import {
  ADMIN_BOOKING_USER_ID,
  CUSTOMER_SELECT,
  GUEST_BOOKING_SELECT,
  customerFromRow,
  guestCustomersFromBookings,
} from "./customerMapper";

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

  // 1. Fetch regular (self-registered) users with their bookings
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select(CUSTOMER_SELECT)
    .neq("id", ADMIN_BOOKING_USER_ID)
    .eq("role", "user")
    .order("full_name");

  if (userError) throw userError;

  const regularCustomers = (userData ?? [])
    .map(customerFromRow)
    .filter(Boolean);

  // 2. Fetch admin-created bookings (under the fixed admin user ID)
  const { data: guestBookings, error: guestError } = await supabase
    .from("bookings")
    .select(GUEST_BOOKING_SELECT)
    .eq("user_id", ADMIN_BOOKING_USER_ID)
    .not("guest_name", "is", null);

  if (guestError) {
    console.warn("Could not fetch guest bookings:", guestError.message);
  }

  const guestCustomers = guestCustomersFromBookings(guestBookings ?? []);

  return sortCustomers([...regularCustomers, ...guestCustomers]);
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
