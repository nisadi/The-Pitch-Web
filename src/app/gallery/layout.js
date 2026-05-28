import { createPageMetadata } from "@/lib/seo/siteConfig";

export const metadata = createPageMetadata({
  title: "Gallery",
  description:
    "View photos of The Pitch Indoor Stadium — futsal courts, cricket nets, cafe, kids area and corporate events at our Maharagama, Attidiya and Moratuwa venues.",
  path: "/gallery",
  keywords: ["indoor stadium photos", "futsal court gallery sri lanka"],
});

export default function GalleryLayout({ children }) {
  return children;
}
