export const EVENT_CARD_ROLE_KEYS = [
  "corporate_packages",
  "corporate_entry",
  "school_programs",
  "school_excellence",
];

export const EVENT_CARD_ROLES = EVENT_CARD_ROLE_KEYS;

export const EVENT_CARD_FALLBACKS = {
  corporate_packages: {
    slug: "corporate-packages",
    section: "corporate",
    cardRole: "packages",
    title: "Corporate Packages",
    description:
      "Boost morale and team synergy through high-stakes competition and elite training facilities. Our corporate packages blend professional meeting spaces with athletic vigor.",
    badges: ["Team Building", "Executive Retreats", "Product Launches"],
    priceTiers: [],
    highlightTags: [],
    footerBadge: "",
    ctaLabel: "",
    ctaHref: "",
    brochureUrl: "",
    price: 0,
    imageUrl: "",
    sortOrder: 1,
  },
  corporate_entry: {
    slug: "corporate-entry",
    section: "corporate",
    cardRole: "entry",
    title: "Corporate Entry",
    description: "",
    badges: [],
    priceTiers: [
      {
        label: "Executive Half-Day",
        sublabel: "Pitch access + Lounge",
        price: 50000,
        priceSuffix: "",
      },
      {
        label: "Stadium Takeover",
        sublabel: "All 5 pitches + Catering",
        price: 100000,
        priceSuffix: "",
      },
    ],
    highlightTags: [],
    footerBadge: "",
    ctaLabel: "DOWNLOAD PDF BROCHURE",
    ctaHref: "",
    brochureUrl: "",
    price: 0,
    imageUrl: "",
    sortOrder: 2,
  },
  school_programs: {
    slug: "school-programs",
    section: "school",
    cardRole: "programs",
    title: "School Programs",
    description: "",
    badges: [],
    priceTiers: [
      {
        label: "Sports Carnival",
        sublabel: "Full day coaching staff",
        price: 1500,
        priceSuffix: "/pp",
      },
      {
        label: "Weekly PE Hire",
        sublabel: "Recurring booking discount",
        price: 1800,
        priceSuffix: "/hr",
      },
    ],
    highlightTags: [],
    footerBadge: "Certified Safe & Insured Facility",
    ctaLabel: "",
    ctaHref: "",
    brochureUrl: "",
    price: 0,
    imageUrl: "",
    sortOrder: 3,
  },
  school_excellence: {
    slug: "school-excellence",
    section: "school",
    cardRole: "excellence",
    title: "School Excellence",
    description:
      "Inspiring the next generation of athletes. We provide a safe, climate-controlled environment for schools to host sports days, training sessions, and inter-school tournaments.",
    badges: [],
    priceTiers: [],
    highlightTags: ["Carnivals", "Weekly PE", "Exams & Graduations"],
    footerBadge: "",
    ctaLabel: "",
    ctaHref: "",
    brochureUrl: "",
    price: 0,
    imageUrl: "",
    sortOrder: 4,
  },
};

export function cardKeyFromRow(section, cardRole) {
  if (section === "corporate" && cardRole === "packages") return "corporate_packages";
  if (section === "corporate" && cardRole === "entry") return "corporate_entry";
  if (section === "school" && cardRole === "programs") return "school_programs";
  if (section === "school" && cardRole === "excellence") return "school_excellence";
  return `${section}_${cardRole}`;
}
