import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseConfigured, getSupabaseAnonKey, getSupabaseUrl } from "./env";

/** Single browser client so Realtime channels stay on one WebSocket connection. */
let browserClient = null;

export function createClient() {
  assertSupabaseConfigured();
  if (!browserClient) {
    browserClient = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return browserClient;
}
