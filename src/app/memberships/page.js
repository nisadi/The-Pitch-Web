import MembershipPackages from "@/components/memberships/MembershipPackages";
import styles from "./memberships.module.css";

export const metadata = {
  title: "Memberships & Packages | The Pitch",
  description:
    "Explore membership plans, session bundles, and packages at The Pitch Indoor Stadium.",
};

export default function MembershipsPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.hero}>
          <span className={styles.eyebrow}>Plans & packages</span>
          <h1>Memberships & packages</h1>
          <p>
            Flexible plans for casual players, regulars, families, and corporate
            teams. Book online in a few clicks.
          </p>
        </header>

        <MembershipPackages />
      </div>
    </div>
  );
}
