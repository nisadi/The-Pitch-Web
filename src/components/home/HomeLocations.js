import { MapPin, Clock } from "lucide-react";
import Image from "next/image";
import styles from "@/app/page.module.css";

const VENUE_SPORTS = ["Cricket", "Cricksal", "Football", "Futsal"];

const HOME_VENUES = [
  {
    label: "The Pitch — Maharagama",
    area: "Maharagama & Pannipitiya",
    address: "347 Avissawella Road, Pannipitiya, Maharagama 10280",
    image: "/images/maharagama.jpeg",
    hours: [
      { days: "Mon – Sun", time: "6:00 AM – 11:00 PM" },
    ],
  },
  {
    label: "The Pitch — Attidiya",
    area: "Dehiwala & Attidiya",
    address: "325/B Attidiya Road, Dehiwala-Mount Lavinia 10350",
    image: "/images/attidiya.jpeg",
    hours: [
      { days: "Mon – Fri", time: "6:00 AM – 12:00 AM" },
      { days: "Saturday", time: "9:00 AM – 12:00 AM" },
      { days: "Sunday", time: "6:00 AM – 12:00 AM" },
    ],
  },
  {
    label: "The Pitch Premiem — Moratuwa",
    area: "Moratuwa & Galle Road",
    address: "210 Sri Rahula Mawatha, Moratuwa 10400",
    image: "/images/moratuwa.jpeg",
    hours: [
      { days: "Mon – Fri", time: "6:00 AM – 12:00 AM" },
      { days: "Sat / Sun / Holidays", time: "6:00 AM – 12:00 AM" },
    ],
  },
];

export default function HomeLocations() {
  return (
    <section className={styles.locations}>
      <div className={styles.sectionTop}>
        <div>
          <h2>Indoor Sports Venues in Colombo</h2>
          <p>
            Find The Pitch near you — book courts in Maharagama, Attidiya or
            Moratuwa.
          </p>
        </div>
      </div>

      <div className={styles.locationGrid}>
        {HOME_VENUES.map((venue) => (
          <article key={venue.label} className={styles.locationCard}>
            <div className={styles.locationHeaderRow}>
              <div className={styles.locationHeader}>
                <MapPin size={18} />
                <h3>{venue.label}</h3>
              </div>
              {venue.image && (
                <Image
                  src={venue.image}
                  alt={`${venue.label} Logo`}
                  width={64}
                  height={64}
                  className={styles.locationLogo}
                />
              )}
            </div>

            <p className={styles.locationArea}>{venue.area}</p>
            <p className={styles.locationAddress}>{venue.address}</p>
            <p className={styles.locationSports}>
              {VENUE_SPORTS.join(" · ")}
            </p>

            {/* Opening hours — always visible */}
            <div className={styles.hoursPanel}>
              <div className={styles.hoursPanelTitle}>
                <Clock size={12} />
                <span>Opening Hours</span>
              </div>
              {venue.hours.map((row) => (
                <div key={row.days} className={styles.hoursRow}>
                  <span className={styles.hoursDays}>{row.days}</span>
                  <span className={styles.hoursTime}>{row.time}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
