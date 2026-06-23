import { normalizeLocation } from "@/components/admin/settings/adminSettingsDefaults";

/**
 * Columns fetched from the locations table.
 * NOTE: open_time, close_time, non_peak_start, non_peak_end, peak_start, peak_end
 * have been removed – those fields are now stored in location_opentimemapping and
 * location_peaktimemapping.  Time mappings are fetched separately and attached as
 * openTimeMappings / peakTimeMappings arrays on the normalised location object.
 */
export const LOCATION_COLUMNS =
  "id, slug, name, short_name, address, phone, description, image_url, sport_ids, is_active, created_at, updated_at";

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
    // Time mappings are populated separately (see locationRealtime / locationMutations)
    openTimeMappings: [],
    peakTimeMappings: [],
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
    is_active: location.status !== "inactive",
    updated_at: new Date().toISOString(),
  };
}
