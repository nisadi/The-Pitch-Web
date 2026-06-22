const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.pitchindoorstadium.com/";

export const SITE_URL = rawSiteUrl;
export const SITE_NAME = "The Pitch Indoor Stadium";
export const SITE_TAGLINE =
  "Indoor futsal, cricket nets & badminton courts across Colombo, Sri Lanka";

export const DEFAULT_DESCRIPTION =
  "Book indoor sports at The Pitch Indoor Stadium — premium futsal courts, cricket nets and badminton in Maharagama, Attidiya and Moratuwa. Online booking, events & corporate packages across Sri Lanka.";

export const DEFAULT_KEYWORDS = [
  "indoor stadium sri lanka",
  "futsal court colombo",
  "indoor football booking",
  "cricket nets maharagama",
  "badminton court moratuwa",
  "sports booking sri lanka",
  "indoor sports colombo",
  "5 a side football sri lanka",
  "The Pitch Indoor Stadium",
  "futsal attidiya",
  "indoor cricket nets colombo",
];

export const VENUES = [
  {
    name: "Maharagama",
    slug: "maharagama",
    label: "The Pitch — Maharagama",
    address: "347 Avissawella Road, Pannipitiya, Maharagama 10280",
    area: "Maharagama & Pannipitiya",
    sports: ["Futsal", "Cricket Nets", "Badminton"],
    description:
      "Our Maharagama venue offers climate-controlled indoor courts on Avissawella Road — ideal for futsal leagues, cricket net sessions and badminton in the Colombo suburbs.",
  },
  {
    name: "Attidiya",
    slug: "attidiya",
    label: "The Pitch — Attidiya",
    address: "325/B Attidiya Road, Dehiwala-Mount Lavinia 10350",
    area: "Dehiwala & Attidiya",
    sports: ["Futsal", "Cricket Nets"],
    description:
      "The Attidiya indoor stadium sits minutes from the coast with multi-sport courts for futsal and cricket nets — a favourite for teams across Dehiwala and Mount Lavinia.",
  },
  {
    name: "Moratuwa",
    slug: "moratuwa",
    label: "The Pitch — Moratuwa",
    address: "210 Sri Rahula Mawatha, Moratuwa 10400",
    area: "Moratuwa & Galle Road",
    sports: ["Futsal", "Badminton"],
    description:
      "Book futsal and badminton at our Moratuwa location on Sri Rahula Mawatha — full-size indoor courts with professional lighting near Galle Road.",
  },
];

export const PUBLIC_ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/booking", changeFrequency: "weekly", priority: 0.9 },
  { path: "/sports", changeFrequency: "weekly", priority: 0.9 },
  { path: "/locations", changeFrequency: "monthly", priority: 0.85 },
  { path: "/events", changeFrequency: "weekly", priority: 0.8 },
  { path: "/gallery", changeFrequency: "monthly", priority: 0.75 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/hours", changeFrequency: "monthly", priority: 0.6 },
];

export function absoluteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  keywords = [],
  noIndex = false,
}) {
  const url = absoluteUrl(path);
  const image = absoluteUrl("/images/hero-stadium.png");

  return {
    title,
    description,
    keywords: [...DEFAULT_KEYWORDS, ...keywords],
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_LK",
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — indoor sports courts in Sri Lanka`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    image: absoluteUrl("/images/hero-stadium.png"),
    telephone: "+94-77-210-3344",
    email: "play@thepitch.lk",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressCountry: "LK",
      addressRegion: "Western Province",
    },
    areaServed: {
      "@type": "Country",
      name: "Sri Lanka",
    },
    sport: ["Futsal", "Cricket", "Badminton", "Indoor Football"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Court & pitch bookings",
      itemListElement: VENUES.map((venue) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "SportsActivityLocation",
          name: venue.label,
          address: venue.address,
        },
      })),
    },
    location: VENUES.map((venue) => ({
      "@type": "Place",
      name: venue.label,
      address: venue.address,
      description: venue.description,
    })),
    sameAs: [],
  };
}
