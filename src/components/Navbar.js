import Link from 'next/link';
import { User } from 'lucide-react';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <img src="/logo.png" alt="The Pitch Indoor Stadium" className={styles.logoImage} />
        </Link>

        <div className={styles.navLinks}>
          <Link href="/" className={styles.link}>Home</Link>
          <Link href="/gallery" className={styles.link}>Gallery</Link>
          <Link href="/sports" className={styles.link}>Facilities</Link>
          <Link href="/booking" className={styles.link}>Booking</Link>
          <Link href="/events" className={styles.link}>Events</Link>
          <Link href="/memberships" className={styles.link}>Membership</Link>
          <Link href="/contact" className={styles.link}>Contact</Link>
        </div>

        <div className={styles.actions}>
          <Link href="/profile" className={styles.profileIcon}>
            <User size={24} />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
