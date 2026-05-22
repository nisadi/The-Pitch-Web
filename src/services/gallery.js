import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchGalleryFromSupabase } from "@/lib/gallery/galleryData";

export const getGallery = async () => {
  if (!isSupabaseConfigured()) return [];

  try {
    return await fetchGalleryFromSupabase({ activeOnly: true });
  } catch (error) {
    console.error("[getGallery]", error);
    return [];
  }
};

/** @deprecated use fetchGalleryFromSupabase — kept for any legacy imports */
export async function getGalleryLegacyRaw() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}