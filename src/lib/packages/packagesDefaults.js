export const PACKAGES_STORAGE_KEY = "the_pitch_packages_v2";

/** Previous storage key (sample packages were auto-saved here). */
export const LEGACY_PACKAGES_STORAGE_KEY = "the_pitch_packages_v1";

/** Built-in demo packages — never shown after migration. */
export const LEGACY_SEED_PACKAGE_IDS = new Set([
  "pkg-maharagama-monthly",
  "pkg-attidiya-bundle",
]);

export const PACKAGE_TEMPLATES = [
  {
    id: "monthly-membership",
    name: "Monthly Membership",
    description:
      "Recurring monthly plan with a fixed number of sessions and member pricing.",
    priceLabel: "per month",
    icon: "CalendarDays",
    suggestedFeatures: [
      "Fixed sessions each month",
      "Member-only booking windows",
      "Priority court allocation",
    ],
    fields: [
      {
        key: "sessionsPerMonth",
        label: "Sessions per month",
        type: "number",
        required: true,
        placeholder: "8",
      },
      {
        key: "validityDays",
        label: "Validity (days)",
        type: "number",
        required: true,
        placeholder: "30",
      },
    ],
  },
  {
    id: "session-bundle",
    name: "Session Bundle",
    description: "Pre-paid pack of court sessions at a discounted rate.",
    priceLabel: "per bundle",
    icon: "Ticket",
    suggestedFeatures: [
      "Use sessions within validity period",
      "Shareable across peak & non-peak",
      "Ideal for regular players",
    ],
    fields: [
      {
        key: "sessionCount",
        label: "Number of sessions",
        type: "number",
        required: true,
        placeholder: "10",
      },
      {
        key: "validityDays",
        label: "Validity (days)",
        type: "number",
        required: true,
        placeholder: "90",
      },
    ],
  },
  {
    id: "day-pass",
    name: "Day Pass",
    description: "Single-day access for casual players and walk-ins.",
    priceLabel: "per day",
    icon: "Sun",
    suggestedFeatures: [
      "Full-day court access",
      "Walk-in friendly",
      "Great for trying The Pitch",
    ],
    fields: [
      {
        key: "hoursIncluded",
        label: "Hours included",
        type: "number",
        required: true,
        placeholder: "2",
      },
    ],
  },
  {
    id: "corporate-block",
    name: "Corporate Block",
    description: "Block bookings for teams, leagues, and company events.",
    priceLabel: "per block",
    icon: "Building2",
    suggestedFeatures: [
      "Dedicated time blocks",
      "Invoice & corporate billing",
      "Equipment add-ons available",
    ],
    fields: [
      {
        key: "courtsIncluded",
        label: "Courts included",
        type: "number",
        required: true,
        placeholder: "2",
      },
      {
        key: "hoursPerBlock",
        label: "Hours per block",
        type: "number",
        required: true,
        placeholder: "3",
      },
    ],
  },
  {
    id: "family-pack",
    name: "Family Pack",
    description: "Multi-player package for families and small groups.",
    priceLabel: "per pack",
    icon: "Users",
    suggestedFeatures: [
      "Covers multiple players",
      "Weekend-friendly slots",
      "Perfect for group outings",
    ],
    fields: [
      {
        key: "playerCount",
        label: "Players included",
        type: "number",
        required: true,
        placeholder: "4",
      },
      {
        key: "sessionCount",
        label: "Sessions included",
        type: "number",
        required: true,
        placeholder: "4",
      },
    ],
  },
  {
    id: "student-pass",
    name: "Student Pass",
    description: "Discounted access for students with valid ID.",
    priceLabel: "per term",
    icon: "GraduationCap",
    suggestedFeatures: [
      "Valid student ID required",
      "Off-peak session focus",
      "Term-based pricing",
    ],
    fields: [
      {
        key: "sessionCount",
        label: "Sessions included",
        type: "number",
        required: true,
        placeholder: "12",
      },
      {
        key: "validityDays",
        label: "Validity (days)",
        type: "number",
        required: true,
        placeholder: "120",
      },
    ],
  },
];

/** Shown only when admin has not saved any packages yet (empty list). */
export const DEFAULT_PACKAGES = [];

export function getTemplateById(templateId) {
  return PACKAGE_TEMPLATES.find((t) => t.id === templateId) ?? null;
}

export function buildPackageFromTemplate(template, overrides = {}) {
  const defaults = {};
  template.fields.forEach((field) => {
    defaults[field.key] = field.type === "number" ? "" : "";
  });

  return {
    templateId: template.id,
    name: "",
    shortDescription: template.description,
    location: "",
    sport: "All sports",
    price: "",
    priceLabel: template.priceLabel,
    features: [...template.suggestedFeatures],
    status: "draft",
    highlighted: false,
    sortOrder: 0,
    ctaLabel: "Book now",
    ctaHref: "/booking",
    details: defaults,
    ...overrides,
  };
}

export function normalizePackage(pkg) {
  const template = getTemplateById(pkg.templateId);
  return {
    id: pkg.id,
    templateId: pkg.templateId,
    name: pkg.name ?? "",
    shortDescription: pkg.shortDescription ?? "",
    location: pkg.location ?? "",
    sport: pkg.sport ?? "All sports",
    price: Number(pkg.price) || 0,
    priceLabel: pkg.priceLabel ?? template?.priceLabel ?? "",
    features: Array.isArray(pkg.features) ? pkg.features : [],
    status: pkg.status === "published" ? "published" : "draft",
    highlighted: Boolean(pkg.highlighted),
    sortOrder: Number(pkg.sortOrder) || 0,
    ctaLabel: pkg.ctaLabel ?? "Book now",
    ctaHref: pkg.ctaHref ?? "/booking",
    details: pkg.details ?? {},
  };
}

export function slugifyPackageId(name) {
  return `pkg-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}
