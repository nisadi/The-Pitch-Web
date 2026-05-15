"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./gallery.module.css";

const CATEGORIES = ["All Access", "Ground", "Cafe", "Kids Area", "Events"];

const GALLERY_ITEMS = [
  {
    id: 1,
    src: "/images/gallery-pitch-a.png",
    title: "Main Arena Pitch A",
    category: "Ground",
    badge: "badgeGround",
    position: "row1",
  },
  {
    id: 2,
    src: "/images/gallery-cafe.png",
    title: "The Fuel Station",
    category: "Cafe",
    badge: "badgeCafe",
    position: "row1",
  },
  {
    id: 3,
    src: "/images/gallery-party.png",
    title: "Championship Parties",
    category: "Events",
    badge: "badgeEvents",
    position: "midLeft",
  },
  {
    id: 4,
    src: "/images/gallery-kids-area.png",
    title: "The Junior Zone",
    category: "Kids Area",
    badge: "badgeKids",
    position: "midTall",
  },
  {
    id: 5,
    src: "/images/gallery-lounge.png",
    title: "Corporate Lounges",
    category: "Events",
    badge: "badgeLounge",
    position: "midLeft",
  },
  {
    id: 6,
    src: "/images/gallery-vantage.png",
    title: "Vantage Seating",
    category: "Ground",
    badge: "badgeGround",
    position: "bottom",
  },
  {
    id: 7,
    src: "/images/gallery-drinks.png",
    title: "Healthy Fuel",
    category: "Cafe",
    badge: "badgeCafe",
    position: "bottom",
  },
  {
    id: 8,
    src: "/images/gallery-lounge.png",
    title: "Corporate Lounges",
    category: "Events",
    badge: "badgeLounge",
    position: "bottom",
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariant = {
  initial: { opacity: 0, y: 40, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.95 },
  transition: { duration: 0.45, ease: "easeOut" },
};

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState("All Access");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const filteredItems =
    activeTab === "All Access"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === activeTab);

  const openLightbox = useCallback((idx) => setLightboxIndex(idx), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const prevImage = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === 0 ? filteredItems.length - 1 : prev - 1
    );
  }, [filteredItems.length]);

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === filteredItems.length - 1 ? 0 : prev + 1
    );
  }, [filteredItems.length]);

  const getGlobalIndex = (item) => filteredItems.indexOf(item);

  // Split items by position for the fixed layout
  const row1Items = filteredItems.filter((i) => i.position === "row1");
  const midLeftItems = filteredItems.filter((i) => i.position === "midLeft");
  const midTallItems = filteredItems.filter((i) => i.position === "midTall");
  const bottomItems = filteredItems.filter((i) => i.position === "bottom");

  // For filtered views, just use a simple grid
  const isFiltered = activeTab !== "All Access";

  return (
    <div className={styles.galleryPage}>
      {/* ─── HERO ─── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <motion.div
            className={styles.heroContent}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className={styles.heroLabel}>Visual Experience</span>
            <h1 className={styles.heroTitle}>
              The Arena In
              <br />
              Focus.
            </h1>
            <p className={styles.heroDesc}>
              Explore our world-class facilities designed for elite performance
              and community spirit. From the precision of our turf to the warmth
              of our cafe.
            </p>
          </motion.div>

          <motion.div
            className={styles.heroVisual}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img
              src="/images/gallery-sports-illustration.png"
              alt="Sports Illustration"
              className={styles.heroIllustration}
            />
          </motion.div>
        </div>
      </section>

      {/* ─── FILTER TABS ─── */}
      <motion.div
        className={styles.filterSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className={styles.filterTabs}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterTab} ${activeTab === cat ? styles.filterTabActive : ""
                }`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── GALLERY GRID ─── */}
      <div className={styles.gallerySection}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {isFiltered ? (
              /* Filtered view — simple 3-col grid */
              <div className={styles.gridRow4}>
                {filteredItems.map((item) => (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    sizeClass={styles.cardBottom}
                    onClick={() => openLightbox(getGlobalIndex(item))}
                  />
                ))}
              </div>
            ) : (
              <>
                {/* Row 1: wide left + narrow right */}
                {row1Items.length > 0 && (
                  <div className={styles.gridRow1}>
                    {row1Items.map((item) => (
                      <GalleryCard
                        key={item.id}
                        item={item}
                        sizeClass={styles.cardStandard}
                        onClick={() => openLightbox(getGlobalIndex(item))}
                      />
                    ))}
                  </div>
                )}

                {/* Middle: 2 stacked left + 1 tall right */}
                {(midLeftItems.length > 0 || midTallItems.length > 0) && (
                  <div className={styles.gridMiddle}>
                    {midLeftItems.map((item) => (
                      <GalleryCard
                        key={item.id}
                        item={item}
                        sizeClass={styles.cardStandard}
                        onClick={() => openLightbox(getGlobalIndex(item))}
                      />
                    ))}
                    {midTallItems.map((item) => (
                      <GalleryCard
                        key={item.id}
                        item={item}
                        sizeClass={`${styles.cardTall} ${styles.gridMiddleTall}`}
                        onClick={() => openLightbox(getGlobalIndex(item))}
                      />
                    ))}
                  </div>
                )}

                {/* Row 4: 3 equal columns */}
                {bottomItems.length > 0 && (
                  <div className={styles.gridRow4}>
                    {bottomItems.map((item) => (
                      <GalleryCard
                        key={item.id}
                        item={item}
                        sizeClass={styles.cardBottom}
                        onClick={() => openLightbox(getGlobalIndex(item))}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── CTA SECTION ─── */}
      <section className={styles.ctaSection}>
        <motion.div
          className={styles.ctaInner}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className={styles.ctaContent}>
            <h2>
              Ready to Experience
              <br />
              It in Person?
            </h2>
            <p>
              Book your first session today and discover why we are the city's
              premier indoor sports destination.
            </p>
          </div>
          <Link href="/booking" className={styles.ctaButton}>
            BOOK YOUR PITCH
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* ─── LIGHTBOX ─── */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredItems[lightboxIndex] && (
          <motion.div
            className={styles.lightboxOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeLightbox}
          >
            <div
              className={styles.lightboxContent}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.lightboxClose}
                onClick={closeLightbox}
                aria-label="Close lightbox"
              >
                <X size={18} />
              </button>

              <button
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={prevImage}
                aria-label="Previous image"
              >
                <ChevronLeft size={22} />
              </button>

              <motion.img
                key={filteredItems[lightboxIndex].id}
                src={filteredItems[lightboxIndex].src}
                alt={filteredItems[lightboxIndex].title}
                className={styles.lightboxImage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              />

              <button
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={nextImage}
                aria-label="Next image"
              >
                <ChevronRight size={22} />
              </button>

              <p className={styles.lightboxCaption}>
                {filteredItems[lightboxIndex].title}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── GALLERY CARD COMPONENT ─── */
function GalleryCard({ item, sizeClass, onClick }) {
  return (
    <motion.div
      className={`${styles.galleryCard} ${sizeClass}`}
      variants={cardVariant}
      whileHover={{ y: -6 }}
      onClick={onClick}
      layout
    >
      <span className={`${styles.cardBadge} ${styles[item.badge]}`}>
        {item.category}
      </span>
      <img src={item.src} alt={item.title} loading="lazy" />
      <div className={styles.cardInfo}>
        <span className={styles.cardTitle}>{item.title}</span>
      </div>
    </motion.div>
  );
}
