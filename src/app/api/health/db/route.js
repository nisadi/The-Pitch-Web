import { NextResponse } from "next/server";
import { isDatabaseConfigured, getSql } from "@/lib/db/sql";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const status = {
    supabase: { configured: isSupabaseConfigured(), ok: false, message: null },
    database: { configured: isDatabaseConfigured(), ok: false, message: null },
  };

  if (status.supabase.configured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      status.supabase.ok = true;
      status.supabase.message = "Supabase API reachable";
    } catch (err) {
      status.supabase.message = err?.message ?? "Supabase API check failed";
    }
  } else {
    status.supabase.message = "Missing NEXT_PUBLIC_SUPABASE_URL or anon/publishable key";
  }

  if (status.database.configured) {
    try {
      const sql = getSql();
      const rows = await sql`select 1 as ok`;
      status.database.ok = rows?.[0]?.ok === 1;
      status.database.message = status.database.ok
        ? "Postgres connection OK"
        : "Unexpected query result";
    } catch (err) {
      status.database.message = err?.message ?? "Database connection failed";
    }
  } else {
    status.database.message = "Missing DATABASE_URL";
  }

  const healthy =
    (!status.supabase.configured || status.supabase.ok) &&
    (!status.database.configured || status.database.ok);

  return NextResponse.json(
    { healthy, ...status },
    { status: healthy ? 200 : 503 }
  );
}
