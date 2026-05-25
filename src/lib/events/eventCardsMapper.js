import {
  EVENT_CARD_FALLBACKS,
  cardKeyFromRow,
} from "./eventCardsDefaults";

export const EVENT_CARD_COLUMNS =
  "id, slug, title, category, description, price, image_url, section, card_role, badges, price_tiers, highlight_tags, footer_badge, cta_label, cta_href, brochure_url, sort_order, is_active, created_at, updated_at";

export function formatEventPrice(amount, suffix = "") {
  const num = Number(amount) || 0;
  const base = `Rs. ${num.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  return `${base}${suffix ?? ""}`;
}

function normalizePriceTier(tier) {
  if (!tier) return null;
  const price = Number(tier.price) || 0;
  const priceSuffix = tier.price_suffix ?? tier.priceSuffix ?? "";
  return {
    label: tier.label ?? "",
    sublabel: tier.sublabel ?? "",
    price,
    priceSuffix,
    priceDisplay: formatEventPrice(price, priceSuffix),
  };
}

export function normalizeEventCard(row) {
  if (!row) return null;

  const section = row.section ?? "corporate";
  const cardRole = row.card_role ?? "packages";
  const key = cardKeyFromRow(section, cardRole);
  const fallback = EVENT_CARD_FALLBACKS[key] ?? {};

  const priceTiers = Array.isArray(row.price_tiers)
    ? row.price_tiers.map(normalizePriceTier).filter(Boolean)
    : [];

  return {
    dbId: row.id ?? null,
    slug: row.slug ?? fallback.slug,
    section,
    cardRole,
    cardKey: key,
    title: row.title ?? fallback.title,
    description: row.description ?? fallback.description ?? "",
    category: row.category ?? section,
    badges: Array.isArray(row.badges) && row.badges.length
      ? row.badges
      : fallback.badges ?? [],
    priceTiers: priceTiers.length ? priceTiers : fallback.priceTiers ?? [],
    highlightTags:
      Array.isArray(row.highlight_tags) && row.highlight_tags.length
        ? row.highlight_tags
        : fallback.highlightTags ?? [],
    footerBadge: row.footer_badge ?? fallback.footerBadge ?? "",
    ctaLabel: row.cta_label ?? fallback.ctaLabel ?? "",
    ctaHref: row.cta_href ?? row.brochure_url ?? fallback.ctaHref ?? "",
    brochureUrl: row.brochure_url ?? fallback.brochureUrl ?? "",
    price: Number(row.price) || 0,
    imageUrl: row.image_url ?? "",
    sortOrder: Number(row.sort_order) || 0,
    isActive: row.is_active !== false,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function eventCardToRow(card) {
  return {
    slug: card.slug,
    title: card.title?.trim(),
    category: card.category ?? card.section,
    description: card.description?.trim() || null,
    price: Number(card.price) || 0,
    image_url: card.imageUrl?.trim() || null,
    section: card.section,
    card_role: card.cardRole,
    badges: Array.isArray(card.badges) ? card.badges : [],
    price_tiers: (card.priceTiers ?? []).map((tier) => ({
      label: tier.label,
      sublabel: tier.sublabel,
      price: Number(tier.price) || 0,
      price_suffix: tier.priceSuffix ?? "",
    })),
    highlight_tags: Array.isArray(card.highlightTags)
      ? card.highlightTags
      : [],
    footer_badge: card.footerBadge?.trim() || null,
    cta_label: card.ctaLabel?.trim() || null,
    cta_href: card.ctaHref?.trim() || null,
    brochure_url: card.brochureUrl?.trim() || card.ctaHref?.trim() || null,
    sort_order: Number(card.sortOrder) || 0,
    is_active: card.isActive !== false,
    updated_at: new Date().toISOString(),
  };
}

function fallbackRow(key) {
  const fb = EVENT_CARD_FALLBACKS[key];
  return {
    slug: fb.slug,
    title: fb.title,
    category: fb.section,
    description: fb.description,
    section: fb.section,
    card_role: fb.cardRole,
    badges: fb.badges,
    price_tiers: (fb.priceTiers ?? []).map((tier) => ({
      label: tier.label,
      sublabel: tier.sublabel,
      price: tier.price,
      price_suffix: tier.priceSuffix ?? "",
    })),
    highlight_tags: fb.highlightTags,
    footer_badge: fb.footerBadge,
    cta_label: fb.ctaLabel,
    cta_href: fb.ctaHref,
    brochure_url: fb.brochureUrl,
    price: fb.price ?? 0,
    image_url: fb.imageUrl ?? null,
    sort_order: fb.sortOrder ?? 0,
    is_active: true,
  };
}

export function buildEventCardsMap(rows) {
  const map = {};
  for (const key of Object.keys(EVENT_CARD_FALLBACKS)) {
    map[key] = normalizeEventCard(fallbackRow(key));
  }

  for (const row of rows ?? []) {
    const card = normalizeEventCard(row);
    if (!card?.isActive) continue;
    map[card.cardKey] = card;
  }

  return mapKeysToPage(map);
}

function mapKeysToPage(map) {
  return {
    corporatePackages: map.corporate_packages,
    corporateEntry: map.corporate_entry,
    schoolPrograms: map.school_programs,
    schoolExcellence: map.school_excellence,
  };
}

export function buildEventCardsMapFromNormalized(cards) {
  const map = {};
  for (const key of Object.keys(EVENT_CARD_FALLBACKS)) {
    map[key] = normalizeEventCard(fallbackRow(key));
  }
  for (const card of cards ?? []) {
    if (!card?.isActive) continue;
    map[card.cardKey] = card;
  }
  return mapKeysToPage(map);
}

export function cardToForm(card) {
  return {
    ...card,
    price: String(card.price ?? ""),
    badgesText: (card.badges ?? []).join("\n"),
    highlightTagsText: (card.highlightTags ?? []).join("\n"),
    priceTiers: (card.priceTiers ?? []).map((tier) => ({
      ...tier,
      price: String(tier.price ?? ""),
    })),
  };
}

export function formToCard(form) {
  const badges = form.badgesText
    ?.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const highlightTags = form.highlightTagsText
    ?.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    ...form,
    price: Number(form.price) || 0,
    category: form.category?.trim() || form.section,
    badges,
    highlightTags,
    priceTiers: (form.priceTiers ?? []).map((tier) => ({
      label: tier.label?.trim() ?? "",
      sublabel: tier.sublabel?.trim() ?? "",
      price: Number(tier.price) || 0,
      priceSuffix: tier.priceSuffix ?? "",
    })),
  };
}
