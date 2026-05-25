import { createClient } from "@/lib/supabase/client";

export const GALLERY_IMAGE_BUCKET = "gallery";

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

export async function uploadGalleryImage(file, { galleryId, title } = {}) {
  const supabase = createClient();
  const ext = EXT_BY_TYPE[file.type] ?? "jpg";
  const folder = galleryId ? String(galleryId) : slugify(title) || "new";
  const path = `${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(GALLERY_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(GALLERY_IMAGE_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}
