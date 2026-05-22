import { normalizeLocation } from "@/components/admin/settings/adminSettingsDefaults";

/** Columns that map 1:1 to LocationFormModal fields (+ slug for stable ids). */
export const LOCATION_COLUMNS =
  "id, slug, name, short_name, address, phone, description, image_url, open_time, close_time, non_peak_start, non_peak_end, peak_start, peak_end, sport_ids, is_active, created_at, updated_at";

/** Normalize DB times (e.g. \"06:00 AM\") to 24h HH:mm for forms and booking grids. */
export function normalizeDbTime(value, fallback = "08:00") {
  if (!value || typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed) && !/am|pm/i.test(trimmed)) {
    const [h, m] = trimmed.split(":");
    return `${String(Number(h)).padStart(2, "0")}:${m}`;
  }
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return trimmed;
  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function slugFromName(name) {
  if (!name) return null;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function locationFromRow(row) {
  if (!row) return null;

  const slug = row.slug ?? slugFromName(row.name);

  return normalizeLocation({
    id: slug ?? String(row.id),
    dbId: row.id,
    name: row.name ?? "",
    shortName: row.short_name ?? "",
    address: row.address ?? "",
    phone: row.phone ?? "",
    description: row.description ?? "",
    image: row.image_url ?? "",
    sportIds: Array.isArray(row.sport_ids) ? row.sport_ids : [],
    operationalStart: normalizeDbTime(row.open_time, "08:00"),
    operationalEnd: normalizeDbTime(row.close_time, "21:00"),
    nonPeakStart: normalizeDbTime(row.non_peak_start, "06:00"),
    nonPeakEnd: normalizeDbTime(row.non_peak_end, "12:00"),
    peakStart: normalizeDbTime(row.peak_start, "18:00"),
    peakEnd: normalizeDbTime(row.peak_end, "22:00"),
    status: row.is_active === false ? "inactive" : "active",
  });
}

function imageUrlForDb(image) {
  if (!image || typeof image !== "string") return null;
  const trimmed = image.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  return trimmed;
}

export function locationToRow(location) {
  const shortName = location.shortName?.trim() ?? "";

  return {
    slug: location.id,
    name: location.name?.trim(),
    short_name: shortName,
    address: location.address?.trim(),
    phone: location.phone?.trim() || null,
    description: location.description?.trim() || null,
    image_url: imageUrlForDb(location.image),
    sport_ids: Array.isArray(location.sportIds) ? location.sportIds : [],
    open_time: location.operationalStart ?? "08:00",
    close_time: location.operationalEnd ?? "21:00",
    non_peak_start: location.nonPeakStart ?? "06:00",
    non_peak_end: location.nonPeakEnd ?? "12:00",
    peak_start: location.peakStart ?? "18:00",
    peak_end: location.peakEnd ?? "22:00",
    is_active: location.status !== "inactive",
    updated_at: new Date().toISOString(),
  };
}
