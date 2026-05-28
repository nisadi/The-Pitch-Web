import { createPageMetadata } from "@/lib/seo/siteConfig";

export const metadata = createPageMetadata({
  title: "Contact Us",
  description:
    "Contact The Pitch Indoor Stadium for bookings, events and support. Find addresses, phone numbers and opening hours for Maharagama, Attidiya and Moratuwa.",
  path: "/contact",
  keywords: [
    "the pitch contact",
    "indoor stadium phone number colombo",
  ],
});

export default function ContactLayout({ children }) {
  return children;
}
