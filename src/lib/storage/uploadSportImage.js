import { createClient } from "@/lib/supabase/client";

export const SPORT_IMAGE_BUCKET = "sports";

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
 * Upload a sport image to Supabase Storage and return its public URL.
 */
export async function uploadSportImage(file, { sportId, sportName } = {}) {
  const supabase = createClient();
  const ext = EXT_BY_TYPE[file.type] ?? "jpg";
  const folder = sportId ? String(sportId) : slugify(sportName) || "new";
  const path = `${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(SPORT_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(SPORT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
