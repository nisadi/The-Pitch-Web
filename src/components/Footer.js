import Link from 'next/link';
import { Mail, MessageCircle, MapPin, ArrowRight } from 'lucide-react';
import styles from './Footer.module.css';

const FacebookIcon = ({ size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Footer = () => {
  const locations = [
    { name: "Moratuwa", address: "210 Sri Rahula Mawatha, Moratuwa 10400" },
    { name: "Pannipitiya", address: "347, Avissawella Road, Pannipitiya, Maharagama, 10280" },
    { name: "Dehiwala", address: "325/B Attidiya Rd, Dehiwala-Mount Lavinia 10350" },
    { name: "Coming Soon", address: "New location adding soon" }
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand Column */}
          <div className={styles.column}>
            <h2 className={styles.logo}>THE PITCH</h2>
            <p className={styles.tagline}>
              Redefining the indoor athletic experience through architectural precision and high-performance standards.
            </p>
            <div className={styles.socials}>
              <a href="#" aria-label="Facebook"><FacebookIcon size={20} /></a>
              <a href="#" aria-label="Instagram"><InstagramIcon size={20} /></a>
              <a href="#" aria-label="WhatsApp"><MessageCircle size={20} /></a>
              <a href="#" aria-label="Email"><Mail size={20} /></a>
            </div>
          </div>

          {/* Support Column */}
          <div className={styles.column}>
            <h3 className={styles.heading}>SUPPORT</h3>
            <ul className={styles.links}>
              <li><Link href="/contact">Contact Support</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/refund">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Explore Column */}
          <div className={styles.column}>
            <h3 className={styles.heading}>EXPLORE</h3>
            <ul className={styles.links}>
              <li><Link href="/hours">Hours of Operation</Link></li>
              <li><Link href="/locations">Location Map</Link></li>
              <li><Link href="/gallery">Gallery</Link></li>
              <li><Link href="/events">Events</Link></li>
            </ul>
          </div>

          {/* Visit Column */}
          <div className={styles.column}>
            <h3 className={styles.heading}>VISIT THE ARENA</h3>
            <div className={styles.locationSelector}>
              <div className={styles.activeLocation}>
                <MapPin size={18} className={styles.pinIcon} />
                <div>
                  <p className={styles.locationAddress}>{locations[1].address}</p>
                  <a href="#" className={styles.getDirections}>
                    GET DIRECTIONS <ArrowRight size={14} />
                  </a>
                </div>
              </div>
              
              <div className={styles.mapContainer}>
                <div className={styles.mapPlaceholder}>
                  <span>Map View</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.bottomLinks}>
            <Link href="/privacy">Privacy Policy</Link>
            <span className={styles.separator}>|</span>
            <Link href="/terms">Terms of Service</Link>
            <span className={styles.separator}>|</span>
            <Link href="/contact">Service & Support</Link>
          </div>
          <div className={styles.copyright}>
            &copy; {new Date().getFullYear()} The Pitch Indoor Stadium. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;