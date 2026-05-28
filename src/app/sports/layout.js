import { createPageMetadata } from "@/lib/seo/siteConfig";

export const metadata = createPageMetadata({
  title: "Sports & Courts",
  description:
    "Explore futsal, cricket nets and badminton at The Pitch Indoor Stadium. Professional indoor courts with peak and off-peak rates across our Sri Lanka venues.",
  path: "/sports",
  keywords: [
    "indoor futsal colombo",
    "cricket practice nets",
    "badminton courts sri lanka",
  ],
});

export default function SportsLayout({ children }) {
  return children;
}
