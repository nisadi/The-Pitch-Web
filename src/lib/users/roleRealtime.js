import { createClient } from "@/lib/supabase/client";
import { compareUsers, userFromRoleRow } from "./usersDefaults";

const ROLE_COLUMNS =
  "id, user_name, email, role, status, display_password, created_at, updated_at";

export async function fetchRoleUsersFromSupabase() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("role")
    .select(ROLE_COLUMNS)
    .order("user_name");

  if (error) throw error;

  return (data ?? []).map(userFromRoleRow).filter(Boolean);
}

export function subscribeToRoleUsers(onPayload) {
  const supabase = createClient();

  const channel = supabase
    .channel("role-table-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "role" },
      onPayload
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error("Supabase realtime subscription failed for role table");
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function applyRoleRealtimeEvent(users, payload) {
  const event = payload.eventType;

  if (event === "DELETE") {
    const id = payload.old?.id;
    if (!id) return users;
    return users.filter((user) => user.id !== id);
  }

  const user = userFromRoleRow(payload.new);
  if (!user?.id) return users;

  const exists = users.some((item) => item.id === user.id);

  if (event === "INSERT" && !exists) {
    return sortUsers([...users, user]);
  }

  return sortUsers(users.map((item) => (item.id === user.id ? user : item)));
}

function sortUsers(list) {
  return [...list].sort(compareUsers);
}
