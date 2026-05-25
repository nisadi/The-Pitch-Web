import { slugifyId } from "@/components/admin/settings/adminSettingsDefaults";

export const PROMO_COLUMNS =
  "id, code, title, description, discount_percentage, discount_amount, location_ids, valid_from, valid_until, is_active, created_at, updated_at";

export function codeFromTitle(title) {
  if (!title) return "";
  return title
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 24);
}

export function normalizeOffer(offer) {
  const dbId = offer.dbId ?? offer.db_id ?? null;
  const code = (offer.code ?? "").trim().toUpperCase();
  const id = offer.id ?? (code ? slugifyId(code) : slugifyId(offer.title ?? ""));

  const discountType =
    offer.discountType ??
    (offer.discount_percentage != null && offer.discount_percentage !== ""
      ? "percent"
      : "fixed");

  const discountValue =
    offer.discountValue ??
    (discountType === "percent"
      ? Number(offer.discount_percentage) || 0
      : Number(offer.discount_amount) || 0);

  return {
    id,
    dbId,
    code,
    title: offer.title ?? "",
    description: offer.description ?? "",
    discountType,
    discountValue,
    locationIds: Array.isArray(offer.locationIds)
      ? offer.locationIds
      : Array.isArray(offer.location_ids)
        ? offer.location_ids
        : [],
    startsAt: offer.startsAt ?? offer.valid_from ?? "",
    endsAt: offer.endsAt ?? offer.valid_until ?? "",
    status:
      offer.status ?? (offer.is_active === false ? "inactive" : "active"),
    createdAt: offer.createdAt ?? offer.created_at ?? null,
    updatedAt: offer.updatedAt ?? offer.updated_at ?? null,
  };
}

export function promoFromRow(row) {
  if (!row) return null;

  const discountType =
    row.discount_percentage != null ? "percent" : "fixed";

  return normalizeOffer({
    id: slugifyId(row.code),
    dbId: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    discountType,
    discount_percentage: row.discount_percentage,
    discount_amount: row.discount_amount,
    location_ids: row.location_ids,
    valid_from: row.valid_from,
    valid_until: row.valid_until,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

export function promoToRow(offer) {
  const code = (offer.code ?? "").trim().toUpperCase();
  const isPercent = offer.discountType === "percent";
  const value = Number(offer.discountValue) || 0;

  return {
    code,
    title: offer.title?.trim() || code,
    description: offer.description?.trim() || null,
    discount_percentage: isPercent ? Math.round(value) : null,
    discount_amount: isPercent ? null : value,
    location_ids: Array.isArray(offer.locationIds) ? offer.locationIds : [],
    valid_from: offer.startsAt || null,
    valid_until: offer.endsAt || null,
    is_active: offer.status !== "inactive",
    updated_at: new Date().toISOString(),
  };
}
