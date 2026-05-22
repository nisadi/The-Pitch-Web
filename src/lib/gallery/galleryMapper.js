export const GALLERY_COLUMNS =
  "id, image_url, title, category, position, sort_order, is_active, created_at, updated_at";

export const GALLERY_CATEGORIES = [
  "Ground",
  "Cafe",
  "Kids Area",
  "Events",
];

export const GALLERY_POSITIONS = [
  { value: "row1", label: "Top row (featured wide)" },
  { value: "midLeft", label: "Middle — left stack" },
  { value: "midTall", label: "Middle — tall right" },
  { value: "bottom", label: "Bottom row" },
];

export function galleryBadgeClass(category) {
  const key = (category || "Ground").replace(/\s+/g, "");
  if (key === "KidsArea") return "badgeKids";
  if (key === "Ground") return "badgeGround";
  if (key === "Cafe") return "badgeCafe";
  if (key === "Events") return "badgeEvents";
  return "badgeGround";
}

export function normalizeGallery(item) {
  const dbId = item.dbId ?? item.id ?? null;
  return {
    id: dbId ? String(dbId) : String(item.id ?? ""),
    dbId,
    imageUrl: item.imageUrl ?? item.image_url ?? "",
    title: item.title ?? "",
    category: item.category ?? "Ground",
    position: item.position ?? "bottom",
    sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
    status: item.is_active === false ? "inactive" : "active",
    isActive: item.is_active !== false,
  };
}

export function galleryFromRow(row) {
  if (!row?.id) return null;
  return normalizeGallery({
    id: row.id,
    dbId: row.id,
    image_url: row.image_url,
    title: row.title,
    category: row.category,
    position: row.position,
    sort_order: row.sort_order,
    is_active: row.is_active,
  });
}

export function galleryToRow(item, { includeSortOrder = true } = {}) {
  const row = {
    image_url: (item.imageUrl ?? item.image_url ?? "").trim(),
    title: (item.title ?? "").trim(),
    category: item.category ?? "Ground",
    position: item.position || "bottom",
    is_active: item.status !== "inactive" && item.isActive !== false,
  };

  if (includeSortOrder) {
    row.sort_order = Number(item.sortOrder ?? item.sort_order ?? 0) || 0;
  }

  return row;
}

export function isMissingGalleryColumnError(error, column = "sort_order") {
  const message = error?.message ?? "";
  return message.includes(column) && message.includes("does not exist");
}
