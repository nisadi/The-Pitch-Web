'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Menu, X, LogIn } from 'lucide-react';
import { getSession } from '@/services/auth';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const { session } = await getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, [pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getLinkClass = (path) => {
    return `${styles.link} ${pathname === path ? styles.active : ''}`;
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <img src="/images/logo.png" alt="The Pitch Indoor Stadium" className={styles.logoImage} />
        </Link>

        <div className={`${styles.navLinks} ${isMobileMenuOpen ? styles.open : ''}`}>
          <Link href="/" className={getLinkClass('/')} onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link href="/gallery" className={getLinkClass('/gallery')} onClick={() => setIsMobileMenuOpen(false)}>Gallery</Link>
          <Link href="/sports" className={getLinkClass('/sports')} onClick={() => setIsMobileMenuOpen(false)}>sports</Link>
          {isAuthenticated && (
            <Link href="/booking" className={getLinkClass('/booking')} onClick={() => setIsMobileMenuOpen(false)}>Booking</Link>
          )}
          <Link href="/events" className={getLinkClass('/events')} onClick={() => setIsMobileMenuOpen(false)}>Events</Link>
          <Link href="/contact" className={getLinkClass('/contact')} onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.actions}>
            {isAuthenticated ? (
              <Link href="/profile" className={styles.profileIcon} onClick={() => setIsMobileMenuOpen(false)}>
                <User size={24} />
              </Link>
            ) : (
              <Link href="/login" className={styles.profileIcon} onClick={() => setIsMobileMenuOpen(false)}>
                <LogIn size={24} />
              </Link>
            )}
          </div>

          <button className={styles.mobileMenuButton} onClick={toggleMobileMenu}>
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
