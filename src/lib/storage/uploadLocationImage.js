import { createClient } from "@/lib/supabase/client";

export const LOCATION_IMAGE_BUCKET = "locations";

const EXT_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Upload a location image to Supabase Storage and return its public URL.
 */
export async function uploadLocationImage(file, { locationId, locationSlug, locationName } = {}) {
  const supabase = createClient();
  const ext = EXT_BY_TYPE[file.type] ?? "jpg";
  const folder =
    locationId ? String(locationId) : locationSlug || slugify(locationName) || "new";
  const path = `${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(LOCATION_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(LOCATION_IMAGE_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

