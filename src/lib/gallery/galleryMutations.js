import { createClient } from "@/lib/supabase/client";
import {
  galleryFromRow,
  galleryToRow,
  isMissingGalleryColumnError,
} from "./galleryMapper";

async function writeGalleryRow(supabase, item, row) {
  if (item.dbId) {
    return supabase
      .from("gallery")
      .update(row)
      .eq("id", item.dbId)
      .select("*")
      .single();
  }

  return supabase.from("gallery").insert(row).select("*").single();
}

export async function upsertGalleryItemClient(item) {
  const supabase = createClient();
  let row = galleryToRow(item);

  let result = await writeGalleryRow(supabase, item, row);

  if (
    result.error &&
    isMissingGalleryColumnError(result.error, "sort_order")
  ) {
    row = galleryToRow(item, { includeSortOrder: false });
    result = await writeGalleryRow(supabase, item, row);
  }

  if (result.error) throw result.error;
  return galleryFromRow(result.data);
}

export async function deleteGalleryItemClient(item) {
  const supabase = createClient();
  const id = item.dbId ?? item.id;
  if (!id) return;

  const { error } = await supabase.from("gallery").delete().eq("id", id);
  if (error) throw error;
}
