"use client";

import styles from './events.module.css';
import { motion } from 'framer-motion';
import { Calendar, Utensils, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/services/auth';
import { getLocations } from '@/services/locations';
import { createEventInquiry } from '@/services/events';
import { fetchEventCardsForPage } from '@/lib/events/eventCardsData';
import { subscribeToEventCards } from '@/lib/events/eventCardsRealtime';
import { Select } from '@/components/ui/Select';

export default function EventsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitStatus, setSubmitStatus] = useState(null); // 'submitting' | 'success' | 'error' | null
  const [cards, setCards] = useState(null);
  const [locations, setLocations] = useState([]);
  
  const [formData, setFormData] = useState({
    organizationName: '',
    contactPerson: '',
    email: '',
    phone: '',
    location: '',
    eventCategory: 'Corporate Team Building',
    guestCount: '',
    preferredDate: '',
    requirements: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { user: currentUser } = await getUser();
      if (currentUser) {
        setUser(currentUser);
        setFormData(prev => ({
          ...prev,
          contactPerson: currentUser.user_metadata?.full_name || '',
          email: currentUser.email || '',
          phone: currentUser.user_metadata?.phone_number || ''
        }));
      }
      setLoadingUser(false);
    };
    checkAuth();

    const fetchLocs = async () => {
      const data = await getLocations();
      setLocations(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, location: prev.location || data[0].name }));
      }
    };
    fetchLocs();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = null;

    const load = async () => {
      const map = await fetchEventCardsForPage();
      if (!cancelled) setCards(map);
    };

    void (async () => {
      await load();
      unsubscribe = await subscribeToEventCards(() => {
        if (!cancelled) void load();
      });
    })();

    return () => {
      cancelled = true;
      void unsubscribe?.();
    };
  }, []);

  const corporatePackages = cards?.corporatePackages;
  const corporateEntry = cards?.corporateEntry;
  const schoolPrograms = cards?.schoolPrograms;
  const schoolExcellence = cards?.schoolExcellence;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=/events');
      return;
    }

    setSubmitStatus('submitting');
    const res = await createEventInquiry({
      organizationName: formData.organizationName,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      eventCategory: formData.eventCategory,
      guestCount: formData.guestCount,
      preferredDate: formData.preferredDate,
      requirements: formData.requirements
    });

    if (res.success) {
      setSubmitStatus('success');
      setFormData({
        organizationName: '',
        contactPerson: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        phone: user?.user_metadata?.phone_number || '',
        location: locations[0]?.name || '',
        eventCategory: 'Corporate Team Building',
        guestCount: '',
        preferredDate: '',
        requirements: ''
      });
    } else {
      setSubmitStatus('error');
    }
  };

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
              <h2 className={styles.cardTitle}>{corporatePackages?.title ?? "Corporate Packages"}</h2>
              <p className={styles.cardDesc}>
                {corporatePackages?.description ?? ""}
              </p>
              <div className={styles.badgeList}>
                {(corporatePackages?.badges ?? []).map((badge) => (
                  <span key={badge} className={styles.pillBadge}>{badge}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Corporate Entry */}
          <motion.div variants={fadeInUp} className={`${styles.card} ${styles.corporateEntryCard}`}>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle} style={{fontSize: "1.8rem"}}>{corporateEntry?.title ?? "Corporate Entry"}</h2>
              <div className={styles.priceList}>
                {(corporateEntry?.priceTiers ?? []).map((tier, index) => (
                  <div
                    key={`${tier.label}-${index}`}
                    className={styles.priceRow}
                    style={index === (corporateEntry?.priceTiers?.length ?? 0) - 1 ? { borderBottom: "none" } : undefined}
                  >
                    <div>
                      <span className={styles.priceLabel}>{tier.label}</span>
                      {tier.sublabel ? (
                        <span className={styles.priceSub}>{tier.sublabel}</span>
                      ) : null}
                    </div>
                    <span className={styles.priceValue}>{tier.priceDisplay}</span>
                  </div>
                ))}
              </div>
              {corporateEntry?.ctaHref ? (
                <a
                  href={corporateEntry.ctaHref}
                  className={styles.orangeBtn}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {corporateEntry.ctaLabel || "DOWNLOAD PDF BROCHURE"}
                </a>
              ) : (
                <button type="button" className={styles.orangeBtn}>
                  {corporateEntry?.ctaLabel || "DOWNLOAD PDF BROCHURE"}
                </button>
              )}
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
              <h2 className={styles.cardTitle} style={{fontSize: "1.8rem"}}>{schoolPrograms?.title ?? "School Programs"}</h2>
              <div className={styles.priceList} style={{marginBottom: "1rem"}}>
                {(schoolPrograms?.priceTiers ?? []).map((tier, index) => (
                  <div
                    key={`${tier.label}-${index}`}
                    className={styles.priceRow}
                    style={{
                      borderBottom:
                        index === (schoolPrograms?.priceTiers?.length ?? 0) - 1
                          ? "none"
                          : undefined,
                    }}
                  >
                    <div>
                      <span className={styles.priceLabel} style={{color: "#444"}}>{tier.label}</span>
                      {tier.sublabel ? (
                        <span className={styles.priceSub} style={{color: "#666"}}>{tier.sublabel}</span>
                      ) : null}
                    </div>
                    <span className={styles.priceValue}>{tier.priceDisplay}</span>
                  </div>
                ))}
              </div>
              {schoolPrograms?.footerBadge ? (
                <div className={styles.certBadge}>
                  <ShieldCheck size={20} color="#B9380F" />
                  {schoolPrograms.footerBadge}
                </div>
              ) : null}
            </div>
          </motion.div>

          {/* School Excellence */}
          <motion.div variants={fadeInUp} className={`${styles.card} ${styles.schoolExcellenceCard}`}>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>{schoolExcellence?.title ?? "School Excellence"}</h2>
              <p className={styles.cardDesc}>
                {schoolExcellence?.description ?? ""}
              </p>
              <div className={styles.greenBtnList}>
                {(schoolExcellence?.highlightTags ?? []).map((tag) => (
                  <button key={tag} type="button" className={styles.darkGreenBtn}>
                    {tag}
                  </button>
                ))}
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
            {loadingUser ? (
              <div className={styles.formCard} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <p>Checking authentication status...</p>
              </div>
            ) : user ? (
              <form className={styles.formCard} onSubmit={handleFormSubmit}>
                {submitStatus === 'success' && <p style={{color: '#00d289', marginBottom: '15px', fontWeight: 'bold'}}>Inquiry submitted successfully! Our team will contact you soon.</p>}
                {submitStatus === 'error' && <p style={{color: 'red', marginBottom: '15px', fontWeight: 'bold'}}>Failed to submit inquiry. Please try again.</p>}
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Organization Name</label>
                    <input type="text" name="organizationName" required value={formData.organizationName} onChange={handleInputChange} className={styles.formInput} placeholder="e.g. Acme Corp" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Contact Person</label>
                    <input type="text" name="contactPerson" required value={formData.contactPerson} onChange={handleInputChange} className={styles.formInput} placeholder="Full Name" />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Contact Email</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className={styles.formInput} placeholder="email@organization.com" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Contact Phone</label>
                    <input type="text" name="phone" required value={formData.phone} onChange={handleInputChange} className={styles.formInput} placeholder="Phone Number" />
                  </div>
                </div>

                <div className={styles.formGroup} style={{marginBottom: "1.5rem"}}>
                  <label>Event Category</label>
                  <select name="eventCategory" value={formData.eventCategory} onChange={handleInputChange} className={styles.formSelect}>
                    <option>Corporate Team Building</option>
                    <option>School Sports Carnival</option>
                    <option>Private Tournament</option>
                    <option>Other Event</option>
                  </select>
                </div>

                <div className={styles.formGroup} style={{marginBottom: "1.5rem"}}>
                  <label>Pitch Location</label>
                  <Select
                    value={formData.location}
                    onValueChange={(val) => setFormData({ ...formData, location: val })}
                    placeholder="Choose a location…"
                    options={locations.map((loc) => ({ value: loc.name, label: loc.name }))}
                    className={styles.formSelect}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Estimated Guests</label>
                    <input type="number" name="guestCount" required value={formData.guestCount} onChange={handleInputChange} className={styles.formInput} placeholder="0" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Preferred Date</label>
                    <input type="date" name="preferredDate" required value={formData.preferredDate} onChange={handleInputChange} className={styles.formInput} />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Event Requirements</label>
                  <textarea 
                    name="requirements"
                    required
                    value={formData.requirements}
                    onChange={handleInputChange}
                    className={styles.formTextarea} 
                    placeholder="Describe your vision (AV, Catering, Coaching, etc.)"
                  ></textarea>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={submitStatus === 'submitting'}>
                  {submitStatus === 'submitting' ? 'SENDING...' : 'SEND INQUIRY'}
                </button>
              </form>
            ) : (
              <div className={styles.formCard} style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '1.5rem' }}>Secure the Arena</h3>
                <p style={{ color: '#aaa', marginBottom: '25px' }}>You must be logged in as an athlete to submit event inquiries and request corporate custom quotes.</p>
                <button 
                  onClick={() => router.push(`/login?redirect=/events`)}
                  className={styles.submitBtn} 
                  style={{ maxWidth: '250px', margin: '0 auto' }}
                >
                  LOG IN TO INQUIRE
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}