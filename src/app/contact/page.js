"use client";

import { useState, useEffect } from 'react';
import styles from './contact.module.css';
import { motion } from 'framer-motion';
import { getLocations } from '@/services/locations';
import { submitContactMessage } from '@/services/contact';
import { getUser } from '@/services/auth';
import { Select } from '@/components/ui/Select';
import { buildScheduleSummary } from '@/lib/locations/locationTimeMapper';

export default function ContactPage() {
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', location: '', subject: 'Facility Inquiry', message: '' });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      const data = await getLocations();
      setLocations(data);
      // Pre-select first real location
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, location: prev.location || data[0].name }));
      }
    };
    
    const fetchUserData = async () => {
      const { user: currentUser } = await getUser();
      if (currentUser) {
        setUser(currentUser);
        setFormData(prev => ({
          ...prev,
          name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
          email: currentUser.email || '',
          phone: currentUser.user_metadata?.phone_number || ''
        }));
      }
    };

    fetchLocations();
    fetchUserData();
  }, []);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    const res = await submitContactMessage({
      fullName: formData.name,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      subject: formData.subject,
      message: formData.message
    });
    if (res.success) {
      setSubmitStatus('success');
      setFormData({
        name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        phone: user?.user_metadata?.phone_number || '',
        location: locations[0]?.name || '',
        subject: 'Facility Inquiry',
        message: ''
      });
    } else {
      setSubmitStatus('error');
    }
  };
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
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
            animate="animate"
            className={styles.cardsGrid}
          >
            {/* Dynamic Locations Cards */}
            {locations.length > 0 ? (
              locations.map((loc, idx) => (
                <motion.div key={loc.id || idx} variants={fadeInUp} className={styles.card}>
                  <h3 className={styles.cardTitle}>{loc.name}</h3>
                  {loc.description && (
                    <p className={styles.cardDescription}>{loc.description}</p>
                  )}
                  
                  <div className={styles.cardItem}>
                    <div className={styles.iconWrapper}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </div>
                    <div className={styles.itemContent}>
                      <span className={styles.itemLabel}>RECEPTION & BOOKINGS</span>
                      <span className={styles.itemValue}>{loc.phone || 'N/A'}</span>
                      <span className={styles.itemSub}>
                        {loc.openTimeMappings?.length > 0
                          ? `Hours: ${buildScheduleSummary(loc.openTimeMappings)}`
                          : 'Hours not available'}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.cardItem}>
                    <div className={`${styles.iconWrapper} ${styles.email}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                    <div className={styles.itemContent}>
                      <span className={styles.itemLabel}>EVENTS & CORPORATE</span>
                      <span className={styles.itemValue} style={{ fontSize: '1.1rem' }}>{`play@thepitch${loc.slug || 'attidiya'}.com`}</span>
                      <span className={styles.itemSub}>Response within 12 business hours</span>
                    </div>
                  </div>
                  
                  <div className={styles.cardItem}>
                    <div className={`${styles.iconWrapper} ${styles.location}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    </div>
                    <div className={styles.itemContent}>
                      <span className={styles.itemLabel}>STADIUM ADDRESS</span>
                      <span className={styles.itemValue} style={{ fontSize: '1rem' }}>
                        {loc.address || 'N/A'}{loc.city ? `, ${loc.city}` : ''}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <p>Loading locations...</p>
            )}
          </motion.div>

          {/* Form Section */}
          <motion.div 
            {...fadeInUp}
            className={styles.formSection}
          >
            <form className={styles.contactForm} onSubmit={handleFormSubmit}>
              {submitStatus === 'success' && <p style={{color: 'green', marginBottom: '10px'}}>Message sent successfully!</p>}
              {submitStatus === 'error' && <p style={{color: 'red', marginBottom: '10px'}}>Failed to send message. Try again.</p>}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleFormChange} required className={styles.formInput} placeholder="Athlete name" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleFormChange} required className={styles.formInput} placeholder="email@athlete.com" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone Number</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleFormChange} className={styles.formInput} placeholder="e.g. +94 77 123 4567" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Location</label>
                  <Select
                    value={formData.location}
                    onValueChange={(val) => setFormData({ ...formData, location: val })}
                    placeholder="Choose a location…"
                    options={locations.map((loc) => ({ value: loc.name, label: loc.name }))}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Subject</label>
                  <select name="subject" value={formData.subject} onChange={handleFormChange} className={styles.formSelect}>
                    <option>Facility Inquiry</option>
                    <option>Event Booking</option>
                    <option>Membership Query</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Your Message</label>
                  <textarea name="message" value={formData.message} onChange={handleFormChange} required className={styles.formTextarea} placeholder="How can we help you step up your game?"></textarea>
                </div>
              </div>
              <div className={styles.submitBtnWrapper}>
                <button type="submit" className={styles.submitBtn} disabled={submitStatus === 'submitting'}>
                  {submitStatus === 'submitting' ? 'Sending...' : 'Send Message'} 
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