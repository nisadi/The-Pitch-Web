"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Star,
  CheckCircle2,
  Clock,
  Coffee,
  Car,
  Users,
  Baby,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const reviews = [
    {
      name: "Jason David",
      role: "CITY LEAGUE CAPTAIN",
      text: "Best turf quality in the city. The lighting is professional and the staff really knows their sports.",
      rating: 5,
    },
    {
      name: "Sarah Lee",
      role: "FITNESS ENTHUSIAST",
      text: "The cafe and amenities are world-class. It feels more like a stadium than just a rental court.",
      rating: 5,
    },
    {
      name: "Michael Ryan",
      role: "SPORTS ANALYST",
      text: "Professional courts, clean facilities, and excellent customer service every time.",
      rating: 5,
    },
  ];

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
        staggerChildren: 0.1
      }
    },
    viewport: { once: true }
  };

  return (
    <div className={styles.container}>
      {/* HERO */}
      <section className={styles.hero}>
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="/images/hero-stadium.png"
          alt="Indoor Stadium"
          className={styles.heroImage}
        />

        <div className={styles.overlay}></div>

        <div className={styles.heroContent}>
          <motion.h1 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={styles.title}
          >
            WHERE
            <br />
            LEGENDS
            <br />
            <span className={styles.titleSpan}>ARE FORGED.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className={styles.subtitle}
          >
            Experience the ultimate indoor athletic arena.
            Professional-grade turf, precision lighting,
            and the energy of a championship game,
            every single day.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className={styles.heroButtons}
          >
            <Link href="/booking" className={styles.primaryBtn}>
              BOOK YOUR PITCH
              <ArrowRight size={18} />
            </Link>

            <Link href="/sports" className={styles.secondaryBtn}>
              EXPLORE FACILITIES
            </Link>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className={styles.infoBar}
        >
          <span>CURRENT TEMP: 68°F</span>
          <span>4 COURTS AVAILABLE TODAY</span>
          <span>CAFE OPEN DAILY</span>
          <span>NEXT TOURNAMENT: SAT 10AM</span>
        </motion.div>
      </section>

      {/* ABOUT */}
      <section className={styles.about}>
        <motion.div 
          {...fadeInUp}
          className={styles.aboutLeft}
        >
          <span className={styles.tag}>THE ARCHITECTURAL ATHLETE</span>

          <h2>
            Built for Precision.
            <br />
            Maintained for Champions.
          </h2>

          <p>
            The Pitch Indoor Stadium isn't just a facility;
            it's a high-performance ecosystem designed to elevate your game.
            From the shock-absorbent flooring to our climate-controlled
            environment, every inch is engineered for safety and momentum.
          </p>

          <div className={styles.stats}>
            <div>
              <h3>4+</h3>
              <span>PRO COURTS</span>
            </div>

            <div>
              <h3>24/7</h3>
              <span>SECURITY</span>
            </div>

            <div>
              <h3>500+</h3>
              <span>WEEKLY PLAYERS</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={styles.hoursCard}
        >
          <div className={styles.hoursTitle}>
            <Clock size={18} />
            <h3>OPEN HOURS</h3>
          </div>

          <div className={styles.hourRow}>
            <span>Monday - Friday</span>
            <span>09:00 AM - 11:00 PM</span>
          </div>

          <div className={styles.hourRow}>
            <span>Saturday</span>
            <span>08:00 AM - 12:00 AM</span>
          </div>

          <div className={styles.hourRow}>
            <span>Sunday</span>
            <span>08:00 AM - 10:00 PM</span>
          </div>

          <div className={styles.noticeBox}>
            <small>HOLIDAY NOTICE</small>
            <p>
              Open on Public Holidays with reduced hours
              (10:00 - 18:00)
            </p>
          </div>
        </motion.div>
      </section>

      {/* FACILITIES */}
      <section className={styles.facilities}>
        <motion.div 
          {...fadeInUp}
          className={styles.sectionTop}
        >
          <div>
            <h2>ELITE FACILITIES</h2>
            <p>Professional amenities for every athlete.</p>
          </div>

          <Link href="/sports" className={styles.viewAll}>
            VIEW ALL AMENITIES
            <ChevronRight size={16} />
          </Link>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className={styles.cardGrid}
        >
          {[
            { img: "courts", icon: Users, title: "Pro Courts", desc: "Shock absorbent hardwood for peak performance." },
            { img: "cafe", icon: Coffee, title: "Sideline Cafe", desc: "Recovery meals and premium coffee available." },
            { img: "parking", icon: Car, title: "Secure Parking", desc: "24/7 monitored parking for all players." },
            { img: "rookie", icon: Baby, title: "Rookie Zone", desc: "Dedicated supervised play area for kids." }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              variants={fadeInUp}
              whileHover={{ y: -10 }}
              className={styles.facilityCard}
            >
              <img src={`/images/facility-${item.img}.png`} alt={item.title} />

              <div className={styles.cardOverlay}>
                <item.icon size={16} />
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* BOOKING */}
      <section className={styles.booking}>
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className={styles.bookingLeft}
        >
          <h2>
            READY TO
            <br />
            PLAY?
          </h2>

          <p>
            Skip the queue and secure your spot instantly.
            Select your sport and time below.
          </p>

          <ul>
            <li>
              <CheckCircle2 size={18} /> Instant Confirmation
            </li>
            <li>
              <CheckCircle2 size={18} /> Free Cancellations (24h)
            </li>
            <li>
              <CheckCircle2 size={18} /> Loyalty Points Earned
            </li>
          </ul>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={styles.bookingForm}
        >
          <div className={styles.formGroup}>
            <label>SELECT SPORT</label>
            <select>
              <option>Indoor Football (5-a-side)</option>
              <option>Basketball</option>
              <option>Cricket Nets</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>DATE</label>
            <input type="date" />
          </div>

          <div className={styles.formGroup}>
            <label>PREFERRED TIME</label>
            <select>
              <option>Evening (18:00 - 22:00)</option>
              <option>Morning (08:00 - 12:00)</option>
              <option>Afternoon (12:00 - 18:00)</option>
            </select>
          </div>

          <button className={styles.primaryBtn}>
            CHECK AVAILABILITY
          </button>
        </motion.div>
      </section>

      {/* REVIEWS */}
      <section className={styles.reviews}>
        <motion.h2 {...fadeInUp}>PLAYER REVIEWS</motion.h2>

        <motion.div 
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className={styles.reviewGrid}
        >
          {reviews.map((review, index) => (
            <motion.div 
              key={index}
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              className={styles.reviewCard} 
            >
              <div className={styles.stars}>
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>

              <p>"{review.text}"</p>

              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  {review.name[0]}
                </div>

                <div>
                  <h4>{review.name}</h4>
                  <span>{review.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
