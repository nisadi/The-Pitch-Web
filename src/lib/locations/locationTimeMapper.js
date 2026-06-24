import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Day-of-week convention: 0 = Monday … 6 = Sunday
// (JS Date.getDay(): 0=Sun … 6=Sat, so we shift with (day + 6) % 7)
// ---------------------------------------------------------------------------

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Convert a JS Date (or a "YYYY-MM-DD" dateKey string) to a dateId (0=Mon … 6=Sun).
 */
export function dateToDateId(date) {
  const d = date instanceof Date ? date : new Date(`${date}T00:00:00`);
  return (d.getDay() + 6) % 7;
}

/**
 * Convert a "YYYY-MM-DD" dateKey string to a dateId without creating a Date in
 * the local timezone (avoids off-by-one day on some systems).
 */
export function dateKeyToDateId(dateKey) {
  if (!dateKey) return null;
  const [y, m, d] = dateKey.split("-").map(Number);
  // new Date(y, m-1, d) uses the local timezone — safe for our purpose
  return ((new Date(y, m - 1, d).getDay()) + 6) % 7;
}

/** Normalize a DB time value like "18:00:00" → "18:00" */
export function normalizeDbTimeField(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value);
  return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

/** Fetch open-time mappings for a single location, sorted by dateId then open_time. */
export async function fetchOpenTimeMappings(locationDbId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("location_opentimemapping")
    .select("open_time_mapping_id, date_id, open_time, close_time")
    .eq("location_id", locationDbId)
    .order("date_id")
    .order("open_time");

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.open_time_mapping_id,
    dateId: row.date_id,
    openTime: normalizeDbTimeField(row.open_time),
    closeTime: normalizeDbTimeField(row.close_time),
  }));
}

/** Fetch peak-time mappings for a single location, sorted by dateId then start_time. */
export async function fetchPeakTimeMappings(locationDbId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("location_peaktimemapping")
    .select("peak_time_mapping_id, date_id, start_time, end_time")
    .eq("location_id", locationDbId)
    .order("date_id")
    .order("start_time");

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.peak_time_mapping_id,
    dateId: row.date_id,
    startTime: normalizeDbTimeField(row.start_time),
    endTime: normalizeDbTimeField(row.end_time),
  }));
}

/**
 * Batch-fetch open-time mappings for multiple location UUIDs.
 * Returns a map: { [locationDbId]: [{ id, dateId, openTime, closeTime }] }
 */
export async function fetchOpenTimeMappingsBatch(locationDbIds) {
  if (!locationDbIds?.length) return {};
  const supabase = createClient();
  const { data, error } = await supabase
    .from("location_opentimemapping")
    .select("open_time_mapping_id, location_id, date_id, open_time, close_time")
    .in("location_id", locationDbIds)
    .order("date_id")
    .order("open_time");

  if (error) throw error;
  const result = {};
  for (const row of data ?? []) {
    const locId = row.location_id;
    if (!result[locId]) result[locId] = [];
    result[locId].push({
      id: row.open_time_mapping_id,
      dateId: row.date_id,
      openTime: normalizeDbTimeField(row.open_time),
      closeTime: normalizeDbTimeField(row.close_time),
    });
  }
  return result;
}

/**
 * Batch-fetch peak-time mappings for multiple location UUIDs.
 * Returns a map: { [locationDbId]: [{ id, dateId, startTime, endTime }] }
 */
export async function fetchPeakTimeMappingsBatch(locationDbIds) {
  if (!locationDbIds?.length) return {};
  const supabase = createClient();
  const { data, error } = await supabase
    .from("location_peaktimemapping")
    .select("peak_time_mapping_id, location_id, date_id, start_time, end_time")
    .in("location_id", locationDbIds)
    .order("date_id")
    .order("start_time");

  if (error) throw error;
  const result = {};
  for (const row of data ?? []) {
    const locId = row.location_id;
    if (!result[locId]) result[locId] = [];
    result[locId].push({
      id: row.peak_time_mapping_id,
      dateId: row.date_id,
      startTime: normalizeDbTimeField(row.start_time),
      endTime: normalizeDbTimeField(row.end_time),
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Write helpers (replace-all strategy: delete then insert)
// ---------------------------------------------------------------------------

/**
 * Replace all open-time mappings for a location.
 * @param {string} locationDbId  - UUID of the location row
 * @param {Array}  slots         - [{ dateId, openTime, closeTime }]
 */
export async function upsertOpenTimeMappings(locationDbId, slots) {
  const supabase = createClient();

  const { error: delError } = await supabase
    .from("location_opentimemapping")
    .delete()
    .eq("location_id", locationDbId);
  if (delError) throw delError;

  if (!slots?.length) return;

  const rows = slots.map((slot) => ({
    location_id: locationDbId,
    date_id: slot.dateId,
    open_time: slot.openTime,
    close_time: slot.closeTime,
  }));

  const { error } = await supabase
    .from("location_opentimemapping")
    .insert(rows);
  if (error) throw error;
}

/**
 * Replace all peak-time mappings for a location.
 * @param {string} locationDbId  - UUID of the location row
 * @param {Array}  slots         - [{ dateId, startTime, endTime }]
 */
export async function upsertPeakTimeMappings(locationDbId, slots) {
  const supabase = createClient();

  const { error: delError } = await supabase
    .from("location_peaktimemapping")
    .delete()
    .eq("location_id", locationDbId);
  if (delError) throw delError;

  if (!slots?.length) return;

  const rows = slots.map((slot) => ({
    location_id: locationDbId,
    date_id: slot.dateId,
    start_time: slot.startTime,
    end_time: slot.endTime,
  }));

  const { error } = await supabase
    .from("location_peaktimemapping")
    .insert(rows);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Convenience helpers used by the pricing / calendar layers
// ---------------------------------------------------------------------------

/**
 * Return open-time slots for a specific dateId (0=Mon … 6=Sun).
 * @returns {Array<{ openTime: string, closeTime: string }>}
 */
export function getOpenSlotsForDay(openTimeMappings, dateId) {
  return (openTimeMappings ?? []).filter((s) => s.dateId === dateId);
}

/**
 * Return peak-time slots for a specific dateId.
 * @returns {Array<{ startTime: string, endTime: string }>}
 */
export function getPeakSlotsForDay(peakTimeMappings, dateId) {
  return (peakTimeMappings ?? []).filter((s) => s.dateId === dateId);
}

/**
 * Derive a single operational window (earliest open → latest close) from the
 * open-time mappings for a given day.  Returns null if no slots exist for that day.
 */
export function getOperationalWindowForDay(openTimeMappings, dateId) {
  const slots = getOpenSlotsForDay(openTimeMappings, dateId);
  if (!slots.length) return null;

  const sorted = [...slots].sort((a, b) => a.openTime.localeCompare(b.openTime));
  const earliest = sorted[0].openTime;
  const latest = sorted.reduce(
    (max, s) => (s.closeTime > max ? s.closeTime : max),
    sorted[0].closeTime
  );
  return { operationalStart: earliest, operationalEnd: latest };
}

/**
 * Build a compact human-readable schedule summary from openTimeMappings.
 * Example: "Mon–Fri 08:00–21:00, Sat 09:00–18:00"
 */
export function buildScheduleSummary(openTimeMappings) {
  if (!openTimeMappings?.length) return "No hours configured";

  // Group days with the same open-windows string together
  const grouped = {};
  for (let i = 0; i < 7; i++) {
    const slots = getOpenSlotsForDay(openTimeMappings, i);
    if (!slots.length) continue;
    const key = slots
      .sort((a, b) => a.openTime.localeCompare(b.openTime))
      .map((s) => `${s.openTime}–${s.closeTime}`)
      .join(", ");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(i);
  }

  return Object.entries(grouped)
    .map(([hours, days]) => {
      const dayRange = buildDayRange(days);
      return `${dayRange} ${hours}`;
    })
    .join(" · ");
}

function buildDayRange(dayIds) {
  if (!dayIds.length) return "";
  const sorted = [...dayIds].sort((a, b) => a - b);
  if (sorted.length === 1) return DAY_LABELS[sorted[0]];

  // Try to build consecutive ranges
  const ranges = [];
  let rangeStart = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i];
    } else {
      ranges.push([rangeStart, prev]);
      rangeStart = sorted[i];
      prev = sorted[i];
    }
  }
  ranges.push([rangeStart, prev]);

  return ranges
    .map(([s, e]) =>
      s === e
        ? DAY_LABELS[s]
        : e === s + 1
        ? `${DAY_LABELS[s]}, ${DAY_LABELS[e]}`
        : `${DAY_LABELS[s]}–${DAY_LABELS[e]}`
    )
    .join(", ");
}
