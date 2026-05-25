/** Which `events` columns are editable per card_role (card_role from DB). */

export const EVENT_CARD_COMMON_FIELDS = [
  "slug",
  "section",
  "cardRole",
  "category",
  "sortOrder",
  "title",
  "description",
  "price",
  "imageUrl",
  "isActive",
];

export const EVENT_CARD_FIELDS_BY_ROLE = {
  packages: ["badges"],
  entry: ["priceTiers", "ctaLabel", "ctaHref", "brochureUrl"],
  programs: ["priceTiers", "footerBadge"],
  excellence: ["highlightTags"],
};

export function fieldsForCardRole(cardRole) {
  const specific = EVENT_CARD_FIELDS_BY_ROLE[cardRole] ?? [];
  return [...EVENT_CARD_COMMON_FIELDS, ...specific];
}

export function cardRoleHasField(cardRole, field) {
  return fieldsForCardRole(cardRole).includes(field);
}
