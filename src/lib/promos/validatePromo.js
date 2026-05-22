import { promoFromRow } from "./promoMapper";

export function formatBookingDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function calculatePromoDiscount(promo, subtotal) {
  const amount = Number(subtotal) || 0;
  if (amount <= 0) return 0;

  const normalized = promo.discountType
    ? promo
    : promoFromRow(promo) ?? promo;

  if (normalized.discountType === "percent") {
    const pct = Number(normalized.discountValue) || 0;
    return Math.min(amount, Math.round((amount * pct) / 100));
  }

  const fixed = Number(normalized.discountValue) || 0;
  return Math.min(amount, fixed);
}

/**
 * @param {object} promo - row from promo_codes or normalized offer
 * @param {object} context - { locationSlug, bookingDate }
 */
export function validatePromoForBooking(promo, context) {
  const normalized = promo.discountType
    ? promo
    : promoFromRow(promo);

  if (!normalized) {
    return { valid: false, error: "Invalid promo code." };
  }

  if (normalized.status === "inactive" || promo.is_active === false) {
    return { valid: false, error: "This promo code is no longer active." };
  }

  const today = formatBookingDate(new Date());
  const bookingDate =
    formatBookingDate(context.bookingDate) ?? today;

  if (normalized.startsAt && bookingDate < normalized.startsAt) {
    return {
      valid: false,
      error: "This promo is not valid for the selected booking date.",
    };
  }

  if (normalized.endsAt && bookingDate > normalized.endsAt) {
    return {
      valid: false,
      error: "This promo has expired for the selected booking date.",
    };
  }

  const locationSlug = (context.locationSlug ?? "").trim().toLowerCase();
  const allowed = (normalized.locationIds ?? []).map((id) =>
    String(id).trim().toLowerCase()
  );

  if (
    allowed.length > 0 &&
    locationSlug &&
    !allowed.includes(locationSlug)
  ) {
    return {
      valid: false,
      error: "This promo does not apply to the selected venue.",
    };
  }

  return { valid: true, promo: normalized };
}
