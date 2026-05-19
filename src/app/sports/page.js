"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Coffee, Car, Droplets } from "lucide-react";
import styles from "./sports.module.css";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  viewport: { once: true },
};

export default function SportsPage() {
  return (
    <div className={styles.pageContainer}>
      {/* ─── HERO SECTION ─── */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <motion.h1 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={styles.heroTitle}
          >
            The Arena
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={styles.heroDesc}
          >
            World-class indoor sporting facilities designed for high-performance athletes and casual competitors alike.
          </motion.p>
        </div>
      </section>

      {/* ─── HERO BOTTOM BAR ─── */}
      <div className={styles.heroBottomBar}>
        <div className="container">
          <ul className={styles.barList}>
            <li className={styles.barItem}>
              <span className={styles.barDot}></span>
              CURRENT TEMP: 68°F
            </li>
            <li className={styles.barItem}>
              <span className={styles.barDot}></span>
              4 COURTS OPEN
            </li>
            <li className={styles.barItem}>
              <span className={styles.barDot}></span>
              PRO-TURF CERTIFIED
            </li>
            <li className={styles.barItem}>
              <span className={styles.barDot}></span>
              24/7 SECURITY
            </li>
          </ul>
        </div>
      </div>

      {/* ─── FACILITIES GRID ─── */}{/*check grid*/}
      <section className={styles.facilitiesSection}>
        <motion.div 
          className={styles.gridContainer}
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
        >
          {/* Cricket */}
          <motion.div variants={fadeInUp} className={`${styles.card} ${styles.cardCricket}`}>
            <img src="/images/cricket-facility.png" alt="Cricket" className={styles.cardBg} />
            <div className={styles.cardOverlay}></div>
            <div className={styles.cardContent}>
              <span className={styles.badge}>MOST POPULAR</span>
              <h2 className={styles.cardTitle}>Cricket</h2>
              <p className={styles.cardDesc}>Experience professional-grade pitches with advanced bowling machines and high-speed motion capture analysis.</p>
              <div className={styles.priceInfo}>
                <span className={styles.priceLabel}>STARTING AT</span>
                <span className={styles.priceValue}>Rs. 3000</span>
                <span className={styles.priceUnit}> /hr</span>
              </div>
            </div>
          </motion.div>

          {/* Football */}
          <motion.div variants={fadeInUp} className={`${styles.card} ${styles.cardFootball}`}>
            <img src="/images/football-facility.png" alt="Football" className={styles.cardBg} />
            <div className={styles.cardOverlay}></div>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>Football</h2>
              <p className={styles.cardDesc}>Full-size indoor arena with premium turf and lighting.</p>
              <div className={styles.priceInfo}>
                <span className={styles.priceLabel}>STARTING AT</span>
                <span className={styles.priceValue}>Rs. 5000</span>
                <span className={styles.priceUnit}> /hr</span>
              </div>
            </div>
          </motion.div>

          {/* Futsal */}
          <motion.div variants={fadeInUp} className={`${styles.card} ${styles.cardFutsal}`}>
            <img src="/images/futsal-facility.png" alt="Futsal" className={styles.cardBg} />
            <div className={styles.cardOverlay}></div>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>Futsal</h2>
              <p className={styles.cardDesc}>Fast-paced action on high-grip surfaces. Perfect for technical skill development and small-sided games.</p>
              <div className={styles.priceInfo}>
                <span className={styles.priceLabel}>STARTING AT</span>
                <span className={styles.priceValue}>Rs. 3000</span>
                <span className={styles.priceUnit}> /hr</span>
              </div>
            </div>
          </motion.div>

          {/* Cricksal Hybrid */}
          <motion.div variants={fadeInUp} className={`${styles.card} ${styles.cardCricksal}`}>
            <div className={styles.cardBg}></div>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>Cricksal Hybrid</h2>
              <p className={styles.cardDesc}>Our signature hybrid format. A custom-built arena that merges the tactical depth of cricket with the explosive pace of futsal.</p>
              <div className={styles.priceRow}>
                <div className={styles.priceInfo}>
                  <span className={styles.priceLabel}>TEAM RATE</span>
                  <span className={styles.priceValue}>Rs. 8000</span>
                  <span className={styles.priceUnit}> /hr</span>
                </div>
                <div className={styles.priceInfo}>
                  <span className={styles.priceLabel}>INDIVIDUAL</span>
                  <span className={styles.priceValue}>Rs. 1000</span>
                  <span className={styles.priceUnit}> /pp</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── ELITE AMENITIES ─── */}
      <section className={styles.amenitiesSection}>
        <div className={styles.amenitiesHeader}>
          <motion.h2 variants={fadeInUp} initial="initial" whileInView="whileInView" className={styles.amenitiesTitle}>
            ELITE AMENITIES
          </motion.h2>
          <motion.p variants={fadeInUp} initial="initial" whileInView="whileInView" className={styles.amenitiesSub}>
            Everything you need to focus on your performance and recovery.
          </motion.p>
        </div>
        
        <motion.div 
          className={styles.amenitiesGrid}
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
        >
          {/* Cafe */}
          <motion.div variants={fadeInUp} className={`${styles.amenityCard} ${styles.orangeBorder}`}>
            <div className={styles.amenityIcon}>
              <Coffee size={24} />
            </div>
            <h3 className={styles.amenityCardTitle}>Courtside Café</h3>
            <p className={styles.amenityCardDesc}>
              Fuel your game with artisan coffee, protein shakes, and healthy performance snacks curated for athletes.
            </p>
            <ul className={styles.amenityFeatures}>
              <li className={styles.amenityFeature}>OPEN 6AM - 10PM</li>
              <li className={styles.amenityFeature}>FREE WI-FI</li>
            </ul>
          </motion.div>

          {/* Parking */}
          <motion.div variants={fadeInUp} className={`${styles.amenityCard} ${styles.greenBorder}`}>
            <div className={styles.amenityIcon}>
              <Car size={24} />
            </div>
            <h3 className={styles.amenityCardTitle}>Secure Parking</h3>
            <p className={styles.amenityCardDesc}>
              Spacious, well-lit multi-level parking for over 200 vehicles with 24/7 CCTV surveillance.
            </p>
            <ul className={styles.amenityFeatures}>
              <li className={styles.amenityFeature}>EV CHARGING AVAILABLE</li>
              <li className={styles.amenityFeature}>DIRECT ARENA ACCESS</li>
            </ul>
          </motion.div>

          {/* Lockers */}
          <motion.div variants={fadeInUp} className={`${styles.amenityCard} ${styles.purpleBorder}`}>
            <div className={styles.amenityIcon}>
              <Droplets size={24} />
            </div>
            <h3 className={styles.amenityCardTitle}>Premium Lockers</h3>
            <p className={styles.amenityCardDesc}>
              Immaculate shower facilities, high-pressure water, and digital locker systems for your peace of mind.
            </p>
            <ul className={styles.amenityFeatures}>
              <li className={styles.amenityFeature}>FRESH TOWEL SERVICE</li>
              <li className={styles.amenityFeature}>CHANGING SUITES</li>
            </ul>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className={styles.ctaSection}>
        <motion.div variants={fadeInUp} initial="initial" whileInView="whileInView">
          <h2 className={styles.ctaTitle}>READY TO PLAY?</h2>
          <p className={styles.ctaSub}>
            Secure your spot at the region's premier indoor sports destination. Group bookings and seasonal passes available.
          </p>
          <Link href="/contact" className={styles.ctaButton}>
            BOOK A FACILITY NOW
          </Link>
        </motion.div>
      </section>
    </div>
  );
}