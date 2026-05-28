import { createPageMetadata } from "@/lib/seo/siteConfig";

export const metadata = createPageMetadata({
  title: "Book a Court",
  description:
    "Book futsal, cricket nets or badminton online at The Pitch Indoor Stadium. Choose your location in Maharagama, Attidiya or Moratuwa and reserve your slot instantly.",
  path: "/booking",
  keywords: [
    "book futsal court colombo",
    "cricket net booking sri lanka",
    "indoor sports reservation",
  ],
});

export default function BookingLayout({ children }) {
  return children;
}
