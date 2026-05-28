import Link from "next/link";
import { Clock } from "lucide-react";
import { createPageMetadata, VENUES } from "@/lib/seo/siteConfig";
import styles from "./hours.module.css";

export const metadata = createPageMetadata({
  title: "Opening Hours",
  description:
    "Opening hours for The Pitch Indoor Stadium venues in Maharagama, Attidiya and Moratuwa. View weekday, weekend and holiday schedules for indoor sports bookings in Sri Lanka.",
  path: "/hours",
  keywords: [
    "indoor stadium opening hours",
    "futsal court hours colombo",
  ],
});

const SCHEDULE = [
  { days: "Monday – Friday", hours: "9:00 AM – 11:00 PM" },
  { days: "Saturday", hours: "8:00 AM – 12:00 AM" },
  { days: "Sunday", hours: "8:00 AM – 10:00 PM" },
  { days: "Public holidays", hours: "10:00 AM – 6:00 PM" },
];

export default function HoursPage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Plan your visit</p>
        <h1>Hours of Operation</h1>
        <p className={styles.lead}>
          The Pitch Indoor Stadium is open seven days a week across our
          Maharagama, Attidiya and Moratuwa venues. Peak and off-peak court
          rates apply — book online to see real-time slot availability.
        </p>
      </header>

      <section className={styles.scheduleCard} aria-labelledby="hours-heading">
        <div className={styles.scheduleTitle}>
          <Clock size={20} aria-hidden="true" />
          <h2 id="hours-heading">Standard opening hours</h2>
        </div>
        <ul className={styles.scheduleList}>
          {SCHEDULE.map((row) => (
            <li key={row.days}>
              <span>{row.days}</span>
              <strong>{row.hours}</strong>
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          Individual venue hours may vary slightly. Check the booking page or
          contact us for venue-specific schedules on special event days.
        </p>
      </section>

      <section className={styles.venues} aria-label="Venues covered">
        <h2>Locations covered</h2>
        <ul>
          {VENUES.map((venue) => (
            <li key={venue.slug}>
              <strong>{venue.label}</strong> — {venue.address}
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.actions}>
        <Link href="/booking" className={styles.primaryBtn}>
          Book a court now
        </Link>
        <Link href="/locations" className={styles.secondaryBtn}>
          View all locations
        </Link>
      </div>
    </div>
  );
}
