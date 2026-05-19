"use client";

import styles from './contact.module.css';
import { motion } from 'framer-motion';

export default function ContactPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: "easeOut" }
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
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={styles.badge}
          >
            GET IN TOUCH
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={styles.heroTitle}
          >
            COMMAND THE
            <span className={styles.heroTitleHighlight}>ARENA.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={styles.heroDescription}
          >
            Questions about bookings, events, or stadium specs? Our coaching team is on standby to help you secure your slot.
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className={styles.heroBottomBar}
        >
          <div className="container">
            <ul className={styles.barList}>
              <li className={styles.barItem}>
                <div className={styles.dot}></div> CURRENT TEMP: 68°F
              </li>
              <li className={styles.barItem}>
                <div className={styles.dot}></div> 4 COURTS OPEN
              </li>
              <li className={styles.barItem}>
                <div className={styles.dot}></div> PRO-TURF CERTIFIED
              </li>
              <li className={styles.barItem}>
                <div className={styles.dot}></div> 24/7 SECURITY
              </li>
            </ul>
          </div>
        </motion.div>
      </section>

      <div className="container">
        {/* Direct Access Section */}
        <section className={styles.mainSection}>
          <motion.h2 
            {...fadeInUp}
            className={styles.sectionTitle}
          >
            Direct Access
          </motion.h2>
          
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className={styles.cardsGrid}
          >
            {/* Attidiya Card */}
            <motion.div variants={fadeInUp} className={styles.card}>
              <h3 className={styles.cardTitle}>Attidiya</h3>
              
              <div className={styles.cardItem}>
                <div className={styles.iconWrapper}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>RECEPTION & BOOKINGS</span>
                  <span className={styles.itemValue}>+94 77 204 1454</span>
                  <span className={styles.itemSub}>Mon-Sun: 6:00 AM – 11:00 PM</span>
                </div>
              </div>
              
              <div className={styles.cardItem}>
                <div className={`${styles.iconWrapper} ${styles.email}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>EVENTS & CORPORATE</span>
                  <span className={styles.itemValue} style={{ fontSize: '1.1rem' }}>play@thepitchattidiya.com</span>
                  <span className={styles.itemSub}>Response within 12 business hours</span>
                </div>
              </div>
              
              <div className={styles.cardItem}>
                <div className={`${styles.iconWrapper} ${styles.location}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>STADIUM ADDRESS</span>
                  <span className={styles.itemValue} style={{ fontSize: '1rem' }}>325/B Attidiya Rd, Dehiwala-Mount Lavinia</span>
                  <span className={styles.itemSub}>10350</span>
                </div>
              </div>
            </motion.div>

            {/* Maharagama Card */}
            <motion.div variants={fadeInUp} className={styles.card}>
              <h3 className={styles.cardTitle}>Maharagama</h3>
              
              <div className={styles.cardItem}>
                <div className={styles.iconWrapper}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>RECEPTION & BOOKINGS</span>
                  <span className={styles.itemValue}>+94 77 204 1418</span>
                  <span className={styles.itemSub}>Mon-Sun: 6:00 AM – 11:00 PM</span>
                </div>
              </div>
              
              <div className={styles.cardItem}>
                <div className={`${styles.iconWrapper} ${styles.email}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>EVENTS & CORPORATE</span>
                  <span className={styles.itemValue} style={{ fontSize: '1.1rem' }}>play@thepitchmaharagama.com</span>
                  <span className={styles.itemSub}>Response within 12 business hours</span>
                </div>
              </div>
              
              <div className={styles.cardItem}>
                <div className={`${styles.iconWrapper} ${styles.location}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>STADIUM ADDRESS</span>
                  <span className={styles.itemValue} style={{ fontSize: '1rem' }}>347, Avissawella Road, Pannipitiya, Maharagama</span>
                  <span className={styles.itemSub}>10280</span>
                </div>
              </div>
            </motion.div>
            {/* Attidiya Card 2 */}
            <motion.div variants={fadeInUp} className={styles.card}>
              <h3 className={styles.cardTitle}>Attidiya</h3>
              
              <div className={styles.cardItem}>
                <div className={styles.iconWrapper}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>RECEPTION & BOOKINGS</span>
                  <span className={styles.itemValue}>+94 77 204 1454</span>
                  <span className={styles.itemSub}>Mon-Sun: 6:00 AM – 11:00 PM</span>
                </div>
              </div>
              
              <div className={styles.cardItem}>
                <div className={`${styles.iconWrapper} ${styles.email}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>EVENTS & CORPORATE</span>
                  <span className={styles.itemValue} style={{ fontSize: '1.1rem' }}>play@thepitchattidiya.com</span>
                  <span className={styles.itemSub}>Response within 12 business hours</span>
                </div>
              </div>
              
              <div className={styles.cardItem}>
                <div className={`${styles.iconWrapper} ${styles.location}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>STADIUM ADDRESS</span>
                  <span className={styles.itemValue} style={{ fontSize: '1rem' }}>325/B Attidiya Rd, Dehiwala-Mount Lavinia</span>
                  <span className={styles.itemSub}>10350</span>
                </div>
              </div>
            </motion.div>

            {/* Maharagama Card 2 */}
            <motion.div variants={fadeInUp} className={styles.card}>
              <h3 className={styles.cardTitle}>Maharagama</h3>
              
              <div className={styles.cardItem}>
                <div className={styles.iconWrapper}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>RECEPTION & BOOKINGS</span>
                  <span className={styles.itemValue}>+94 77 204 1418</span>
                  <span className={styles.itemSub}>Mon-Sun: 6:00 AM – 11:00 PM</span>
                </div>
              </div>
              
              <div className={styles.cardItem}>
                <div className={`${styles.iconWrapper} ${styles.email}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>EVENTS & CORPORATE</span>
                  <span className={styles.itemValue} style={{ fontSize: '1.1rem' }}>play@thepitchmaharagama.com</span>
                  <span className={styles.itemSub}>Response within 12 business hours</span>
                </div>
              </div>
              
              <div className={styles.cardItem}>
                <div className={`${styles.iconWrapper} ${styles.location}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div className={styles.itemContent}>
                  <span className={styles.itemLabel}>STADIUM ADDRESS</span>
                  <span className={styles.itemValue} style={{ fontSize: '1rem' }}>347, Avissawella Road, Pannipitiya, Maharagama</span>
                  <span className={styles.itemSub}>10280</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Form Section */}
          <motion.div 
            {...fadeInUp}
            className={styles.formSection}
          >
            <form className={styles.contactForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input type="text" className={styles.formInput} placeholder="Athlete name" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input type="email" className={styles.formInput} placeholder="email@athlete.com" />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Subject</label>
                  <select className={styles.formSelect}>
                    <option>Facility Inquiry</option>
                    <option>Event Booking</option>
                    <option>Membership Query</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Your Message</label>
                  <textarea className={styles.formTextarea} placeholder="How can we help you step up your game?"></textarea>
                </div>
              </div>
              <div className={styles.submitBtnWrapper}>
                <button type="submit" className={styles.submitBtn}>
                  Transmit Message 
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </div>
            </form>
          </motion.div>
        </section>
      </div>
    </div>
  );
}