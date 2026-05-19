"use client";

import styles from './events.module.css';
import { motion } from 'framer-motion';
import { Calendar, Utensils, ShieldCheck } from 'lucide-react';

export default function EventsPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.2
      }
    },
    viewport: { once: true }
  };

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
            UNFORGETTABLE
            <span className={styles.heroTitleHighlight}>STADIUM EVENTS</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={styles.heroDesc}
          >
            From corporate high-performance workshops to school sports carnivals, host your next event in a venue built for legends.
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className={styles.heroBottomBar}
        >
          <ul className={styles.bottomBarList}>
            <li className={styles.bottomBarItem}>
              <div className={styles.dot}></div> 5 FIFA-GRADE INDOOR PITCHES
            </li>
            <li className={styles.bottomBarItem}>
              <div className={styles.dot}></div> FULL AV & CATERING SUPPORT
            </li>
            <li className={styles.bottomBarItem}>
              <div className={styles.dot}></div> SCHOOL & CORPORATE RATES AVAILABLE
            </li>
            <li className={styles.bottomBarItem}>
              <div className={styles.dot}></div> 24/7 FACILITY MANAGEMENT
            </li>
          </ul>
        </motion.div>
      </section>

      {/* ─── EVENTS SECTION ─── */}
      <section className={styles.eventsSection}>
        <motion.div 
          className={styles.gridContainer}
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Corporate Packages */}
          <motion.div variants={fadeInUp} className={`${styles.card} ${styles.corporatePackagesCard}`}>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>Corporate Packages</h2>
              <p className={styles.cardDesc}>
                Boost morale and team synergy through high-stakes competition and elite training facilities. Our corporate packages blend professional meeting spaces with athletic vigor.
              </p>
              <div className={styles.badgeList}>
                <span className={styles.pillBadge}>Team Building</span>
                <span className={styles.pillBadge}>Executive Retreats</span>
                <span className={styles.pillBadge}>Product Launches</span>
              </div>
            </div>
          </motion.div>

          {/* Corporate Entry */}
          <motion.div variants={fadeInUp} className={`${styles.card} ${styles.corporateEntryCard}`}>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle} style={{fontSize: "1.8rem"}}>Corporate Entry</h2>
              <div className={styles.priceList}>
                <div className={styles.priceRow}>
                  <div>
                    <span className={styles.priceLabel}>Executive Half-Day</span>
                    <span className={styles.priceSub}>Pitch access + Lounge</span>
                  </div>
                  <span className={styles.priceValue}>Rs. 50000.00</span>
                </div>
                <div className={styles.priceRow}>
                  <div>
                    <span className={styles.priceLabel}>Stadium Takeover</span>
                    <span className={styles.priceSub}>All 5 pitches + Catering</span>
                  </div>
                  <span className={styles.priceValue}>Rs. 100000.00</span>
                </div>
              </div>
              <button className={styles.orangeBtn}>DOWNLOAD PDF BROCHURE</button>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className={styles.bottomGridContainer}
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* School Programs */}
          <motion.div variants={fadeInUp} className={`${styles.card} ${styles.schoolProgramsCard}`}>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle} style={{fontSize: "1.8rem"}}>School Programs</h2>
              <div className={styles.priceList} style={{marginBottom: "1rem"}}>
                <div className={styles.priceRow}>
                  <div>
                    <span className={styles.priceLabel} style={{color: "#444"}}>Sports Carnival</span>
                    <span className={styles.priceSub} style={{color: "#666"}}>Full day coaching staff</span>
                  </div>
                  <span className={styles.priceValue}>Rs. 1500.00/pp</span>
                </div>
                <div className={styles.priceRow} style={{borderBottom: "none"}}>
                  <div>
                    <span className={styles.priceLabel} style={{color: "#444"}}>Weekly PE Hire</span>
                    <span className={styles.priceSub} style={{color: "#666"}}>Recurring booking discount</span>
                  </div>
                  <span className={styles.priceValue}>Rs. 1800/hr</span>
                </div>
              </div>
              <div className={styles.certBadge}>
                <ShieldCheck size={20} color="#B9380F" />
                Certified Safe & Insured Facility
              </div>
            </div>
          </motion.div>

          {/* School Excellence */}
          <motion.div variants={fadeInUp} className={`${styles.card} ${styles.schoolExcellenceCard}`}>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>School Excellence</h2>
              <p className={styles.cardDesc}>
                Inspiring the next generation of athletes. We provide a safe, climate-controlled environment for schools to host sports days, training sessions, and inter-school tournaments.
              </p>
              <div className={styles.greenBtnList}>
                <button className={styles.darkGreenBtn}>Carnivals</button>
                <button className={styles.darkGreenBtn}>Weekly PE</button>
                <button className={styles.darkGreenBtn}>Exams & Graduations</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── BOOKING SECTION ─── */}
      <section className={styles.bookingSection}>
        <div className={styles.contactGrid}>
          {/* Left: Info */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className={styles.contactInfo}
          >
            <h2 className={styles.contactTitle}>
              SECURE THE
              <span className={styles.contactTitleHighlight}>ARENA</span>
            </h2>
            <p className={styles.contactDesc}>
              Our event coordinators are ready to help you plan the perfect experience. Fill out the request form and our team will get back to you within 24 hours with a custom quote.
            </p>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <Calendar size={24} />
                </div>
                <div className={styles.featureText}>
                  <h4>Flexible Scheduling</h4>
                  <p>Available for dawn-to-midnight bookings, 365 days a year.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <Utensils size={24} />
                </div>
                <div className={styles.featureText}>
                  <h4>Catering Integration</h4>
                  <p>From sports drinks and snacks to formal corporate luncheons.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <form className={styles.formCard} onSubmit={(e) => e.preventDefault()}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Organization Name</label>
                  <input type="text" className={styles.formInput} placeholder="e.g. Acme Corp" />
                </div>
                <div className={styles.formGroup}>
                  <label>Contact Person</label>
                  <input type="text" className={styles.formInput} placeholder="Full Name" />
                </div>
              </div>

              <div className={styles.formGroup} style={{marginBottom: "1.5rem"}}>
                <label>Event Category</label>
                <select className={styles.formSelect}>
                  <option>Corporate Team Building</option>
                  <option>School Sports Carnival</option>
                  <option>Private Tournament</option>
                  <option>Other Event</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Estimated Guests</label>
                  <input type="number" className={styles.formInput} placeholder="0" />
                </div>
                <div className={styles.formGroup}>
                  <label>Preferred Date</label>
                  <input type="date" className={styles.formInput} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Event Requirements</label>
                <textarea 
                  className={styles.formTextarea} 
                  placeholder="Describe your vision (AV, Catering, Coaching, etc.)"
                ></textarea>
              </div>

              <button type="submit" className={styles.submitBtn}>
                SEND INQUIRY
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}