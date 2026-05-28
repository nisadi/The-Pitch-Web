import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { createPageMetadata, VENUES } from "@/lib/seo/siteConfig";
import styles from "./locations.module.css";

export const metadata = createPageMetadata({
  title: "Locations",
  description:
    "Find The Pitch Indoor Stadium venues in Maharagama, Attidiya and Moratuwa. Indoor futsal courts, cricket nets and badminton facilities across the Colombo area, Sri Lanka.",
  path: "/locations",
  keywords: [
    "indoor stadium maharagama",
    "futsal court attidiya",
    "indoor sports moratuwa",
    "sports venues colombo suburbs",
  ],
});

export default function LocationsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Visit The Pitch</p>
        <h1>Indoor Stadium Locations in Colombo & Sri Lanka</h1>
        <p className={styles.lead}>
          The Pitch Indoor Stadium operates premium indoor sports facilities
          across three venues in the Colombo suburbs. Book futsal, cricket nets
          or badminton at the location closest to you.
        </p>
      </header>

      <section className={styles.grid} aria-label="Venue locations">
        {VENUES.map((venue) => (
          <article key={venue.slug} className={styles.card}>
            <div className={styles.cardHeader}>
              <MapPin size={20} aria-hidden="true" />
              <h2>{venue.label}</h2>
            </div>
            <p className={styles.area}>{venue.area}</p>
            <p className={styles.address}>{venue.address}</p>
            <p className={styles.description}>{venue.description}</p>
            <p className={styles.sports}>
              <strong>Sports:</strong> {venue.sports.join(" · ")}
            </p>
            <div className={styles.actions}>
              <Link href="/booking" className={styles.primaryLink}>
                Book at {venue.name}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/contact" className={styles.secondaryLink}>
                Contact this venue
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.bottomCta}>
        <h2>Not sure which venue to choose?</h2>
        <p>
          Our team can recommend the best court for your sport, group size and
          preferred time slot. Reach out or start a booking to see live
          availability.
        </p>
        <div className={styles.bottomActions}>
          <Link href="/booking" className={styles.primaryLink}>
            Check availability
          </Link>
          <Link href="/contact" className={styles.secondaryLink}>
            Get in touch
          </Link>
        </div>
      </section>
    </div>
  );
}
