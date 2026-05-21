import { neon } from "@neondatabase/serverless";

/**
 * Raw SQL against Supabase Postgres. Use the Session pooler URL in DATABASE_URL
 * when your network is IPv4-only (see SUPABASE.md).
 */
export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase connection string to .env.local."
    );
  }
  return neon(databaseUrl);
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
