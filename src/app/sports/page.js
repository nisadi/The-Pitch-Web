"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Coffee, Car, Droplets } from "lucide-react";
import styles from "./sports.module.css";
import { getSports } from "@/services/sports";
import { getSession } from "@/services/auth";

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
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadSports = async () => {
      const data = await getSports();
      setSports(data);
      setLoading(false);
    };
    loadSports();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { session } = await getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

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
            Indoor Sports & Courts in Sri Lanka
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={styles.heroDesc}
          >
            Book futsal, and cricket nets at The Pitch Indoor Stadium.
            Professional courts across Maharagama, Attidiya and Moratuwa with
            peak and off-peak rates.
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
              3 COURTS OPEN
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

      <section className={styles.facilitiesSection}>
        <motion.div 
          className={styles.gridContainer}
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
        >
          {loading ? (
            <p style={{ textAlign: "center", color: "#fff", width: "100%" }}>Loading sports...</p>
          ) : sports.length > 0 ? (
            sports.map((sport) => {
              const displayPrice = sport.base_price || sport.price || 3000;
              return (
                <motion.div key={sport.id} variants={fadeInUp} className={styles.card}>
                  {sport.image_url && <img src={sport.image_url} alt={sport.name} className={styles.cardBg} />}
                  {!sport.image_url && <div className={styles.cardBg}></div>}
                  <div className={styles.cardOverlay}></div>
                  <div className={styles.cardContent}>
                    {sport.name.toLowerCase().includes("cricket") && <span className={styles.badge}>MOST POPULAR</span>}
                    <h2 className={styles.cardTitle}>{sport.name}</h2>
                    <p className={styles.cardDesc}>{sport.description}</p>
                    <div className={styles.priceInfo}>
                      <span className={styles.priceLabel}>STARTING AT</span>
                      <span className={styles.priceValue}>Rs. {displayPrice}</span>
                      <span className={styles.priceUnit}> /hr</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <p style={{ textAlign: "center", color: "#fff", width: "100%" }}>No sports found.</p>
          )}
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
          <Link
            href={isAuthenticated ? "/booking" : "/login"}
            className={styles.ctaButton}
          >
            BOOK A FACILITY NOW
          </Link>        </motion.div>
      </section>
    </div>
  );
}