import { createPageMetadata } from "@/lib/seo/siteConfig";

export const metadata = createPageMetadata({
  title: "Events & Corporate Packages",
  description:
    "Host corporate team building, school sports days, tournaments and private events at The Pitch Indoor Stadium. Enquire about packages across our Colombo-area venues.",
  path: "/events",
  keywords: [
    "corporate sports events sri lanka",
    "indoor tournament venue colombo",
    "team building futsal",
  ],
});

export default function EventsLayout({ children }) {
  return children;
}
