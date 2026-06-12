import { MapPin } from "lucide-react";
import styles from "@/app/page.module.css";

const VENUE_SPORTS = ["Cricket", "Cricksal", "Football", "Futsal"];

const HOME_VENUES = [
  {
    label: "The Pitch — Maharagama",
    area: "Maharagama & Pannipitiya",
    address: "347 Avissawella Road, Pannipitiya, Maharagama 10280",
  },
  {
    label: "The Pitch — Attidiya",
    area: "Dehiwala & Attidiya",
    address: "325/B Attidiya Road, Dehiwala-Mount Lavinia 10350",
  },
  {
    label: "The Pitch — Moratuwa",
    area: "Moratuwa & Galle Road",
    address: "210 Sri Rahula Mawatha, Moratuwa 10400",
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
            <div className={styles.locationHeader}>
              <MapPin size={18} />
              <h3>{venue.label}</h3>
            </div>
            <p className={styles.locationArea}>{venue.area}</p>
            <p className={styles.locationAddress}>{venue.address}</p>
            <p className={styles.locationSports}>
              {VENUE_SPORTS.join(" · ")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
