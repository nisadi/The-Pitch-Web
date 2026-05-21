export const SPORT_COLUMNS =
  "id, name, slug, icon, image_url, description, is_active, created_at, updated_at";

export function slugFromSportName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function imageUrlForDb(image) {
  if (!image || typeof image !== "string") return null;
  const trimmed = image.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  return trimmed;
}

export function normalizeSport(sport) {
  const dbId = sport.dbId ?? sport.db_id ?? null;
  const slug = sport.slug ?? slugFromSportName(sport.name);
  const id = dbId ? String(dbId) : String(sport.id ?? slug);

  return {
    id,
    dbId,
    name: sport.name ?? "",
    slug,
    icon: sport.icon ?? slug,
    image: sport.image ?? sport.image_url ?? "",
    description: sport.description ?? "",
    status: sport.status ?? (sport.is_active === false ? "inactive" : "active"),
    createdAt: sport.createdAt ?? sport.created_at ?? null,
    updatedAt: sport.updatedAt ?? sport.updated_at ?? null,
  };
}

export function sportFromRow(row) {
  if (!row) return null;

  return normalizeSport({
    id: row.id,
    dbId: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    image_url: row.image_url,
    description: row.description,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

export function sportToRow(sport) {
  const slug = (sport.slug ?? slugFromSportName(sport.name))?.trim();

  return {
    name: sport.name?.trim(),
    slug,
    icon: (sport.icon?.trim() || slug) ?? null,
    image_url: imageUrlForDb(sport.image),
    description: sport.description?.trim() || null,
    is_active: sport.status !== "inactive",
    updated_at: new Date().toISOString(),
  };
}
