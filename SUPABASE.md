# Supabase setup — The Pitch

Project ref: **obgaqcmxhrmslgjaerel**

## 1. Environment variables

Copy the example file and add your secrets:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Where to find it |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | [API settings](https://supabase.com/dashboard/project/obgaqcmxhrmslgjaerel/settings/api) → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` / secret key (server only) |
| `DATABASE_URL` | [Database settings](https://supabase.com/dashboard/project/obgaqcmxhrmslgjaerel/settings/database) → Connection string |

### IPv4 networks

The direct host `db.obgaqcmxhrmslgjaerel.supabase.co` is **not IPv4-compatible** on the free tier. For `DATABASE_URL`, use the **Session pooler** string from the dashboard (Connect → ORMs / Session pooler), for example:

```text
postgresql://postgres.obgaqcmxhrmslgjaerel:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

Replace `[REGION]` with your project region from the dashboard.

## 2. Verify connection

```bash
npm run dev
```

Open [http://localhost:3000/api/health/db](http://localhost:3000/api/health/db). You should see `"healthy": true` when URL, keys, and `DATABASE_URL` are correct.

## 3. Code layout

| Path | Purpose |
|------|---------|
| `src/lib/supabase/client.js` | Browser / Client Components |
| `src/lib/supabase/server.js` | Server Components, Route Handlers |
| `src/lib/supabase/admin.js` | Elevated server operations (bypass RLS) |
| `src/lib/db/sql.js` | Raw SQL via `@neondatabase/serverless` + `DATABASE_URL` |
| `src/middleware.js` | Refreshes Supabase auth session cookies |

Example (server):

```js
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data, error } = await supabase.from("your_table").select();
```

Example (raw SQL):

```js
import { getSql } from "@/lib/db/sql";

const sql = getSql();
const rows = await sql`select * from your_table limit 10`;
```

## 4. Database schema

Run migrations in order from the [SQL Editor](https://supabase.com/dashboard/project/obgaqcmxhrmslgjaerel/sql/new):

| File | Tables |
|------|--------|
| `00001_initial_schema.sql` | locations, sports, bookings |
| `00002_user_roles_and_team_users.sql` | **user_roles**, **team_users** (FK `role_id`), view `team_users_with_roles` |

**Users:** When Supabase env vars are set, the admin Users page loads from `team_users` + `user_roles` and syncs invites/updates back. Without Supabase, it uses localStorage (`the_pitch_admin_users_v2`) with the same `roleId` model.

## 5. Supabase MCP (run SQL from Cursor)

This repo includes `.cursor/mcp.json` pointing at the hosted Supabase MCP:

```json
{ "mcpServers": { "supabase": { "url": "https://mcp.supabase.com/mcp" } } }
```

1. Open **Cursor Settings → MCP** and enable the **supabase** server (reload if needed).
2. Sign in when prompted and select project **obgaqcmxhrmslgjaerel**.
3. Ask the agent to apply `supabase/migrations/*.sql` via MCP.

Without MCP connected, run the same files manually in the [SQL Editor](https://supabase.com/dashboard/project/obgaqcmxhrmslgjaerel/sql/new).

## 6. Optional: Agent Skills

```bash
npx skills add supabase/agent-skills
```

Gives Cursor/AI helpers for Supabase-specific patterns.

## 7. Deploy

Add the same variables in Vercel (or your host) under **Environment Variables**. Never commit `.env.local`.
