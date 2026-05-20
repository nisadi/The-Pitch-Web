"use client";

import React from "react";
import Link from "next/link";
import styles from "./confirm.module.css";
import { motion } from "framer-motion";

import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Download,
  ArrowRight,
  ShieldCheck,
  Shirt,
  CircleOff,
} from "lucide-react";

export default function BookingConfirmPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.1 },
    transition: { duration: 0.6, ease: "easeOut" },
  };

  return (
    <div className={styles.container}>
      {/* SUCCESS HEADER */}
      <motion.div {...fadeInUp} className={styles.successHeader}>
        <div className={styles.iconBox}>
          <CheckCircle2 size={30} />
        </div>

        <h1 className={styles.successTitle}>BOOKING CONFIRMED</h1>

        <p className={styles.successSubtitle}>
          Your session at the arena is secured. Get ready to perform.
          <br />
          We've sent a detailed confirmation to your email.
        </p>
      </motion.div>

      {/* MAIN GRID */}
      <div className={styles.mainGrid}>
        {/* LEFT SIDE */}
        <motion.div {...fadeInUp} className={styles.leftCard}>
          {/* TOP */}
          <div className={styles.referenceTop}>
            <div>
              <span className={styles.refLabel}>
                BOOKING REFERENCE
              </span>

              <h2 className={styles.refNumber}>#TP-94821-X</h2>
            </div>

            <div className={styles.badge}>PREMIUM COURT</div>
          </div>

          {/* DETAILS */}
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                <Calendar size={12} />
                DATE
              </span>

              <span className={styles.detailValue}>
                Friday, Nov 15, 2024
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                <Clock size={12} />
                TIME SLOT
              </span>

              <span className={styles.detailValue}>
                06:00 PM - 08:00 PM
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                <MapPin size={12} />
                LOCATION
              </span>

              <span className={styles.detailValue}>
                Indoor Pitch 4 (Futsal Pro)
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                <ShieldCheck size={12} />
                STATUS
              </span>

              <span
                className={`${styles.detailValue} ${styles.statusPaid}`}
              >
                Fully Paid
              </span>
            </div>
          </div>

          {/* DOWNLOAD */}
          <div className={styles.downloadBtnWrapper}>
            <button className={styles.downloadBtn}>
              <Download size={16} />
              Download Receipt
            </button>
          </div>
        </motion.div>

        {/* RIGHT SIDE */}
        <motion.div {...fadeInUp} className={styles.rightCols}>
          {/* VENUE CARD */}
          <div className={styles.venueCard}>
            <img
              src="https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1200&auto=format&fit=crop"
              alt="Indoor Pitch"
              className={styles.venueImage}
            />

            <div className={styles.venueInfo}>
              <h3>The Pitch 4</h3>

              <p>
                Elite level synthetic turf, climate-controlled,
                and HD replay cameras enabled.
              </p>

              <button className={styles.linkBtn}>
                View Venue Rules
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* MANAGE CARD */}
          <div className={styles.manageCard}>
            <h3>Manage Schedule</h3>

            <p>
              Want to change your time or book another session?
            </p>

            <button className={styles.outlineBtn}>
              View My Bookings
            </button>
          </div>
        </motion.div>
      </div>

      {/* BOTTOM INFO */}
      <motion.div {...fadeInUp} className={styles.infoSection}>
        <div className={styles.infoBlock}>
          <ArrowRight size={18} />

          <h4>Early Arrival</h4>

          <p>
            Please arrive 15 minutes before your slot to complete
            the check-in process at the front desk.
          </p>
        </div>

        <div className={styles.infoBlock}>
          <Shirt size={18} />

          <h4>Equipment</h4>

          <p>
            Balls and training bibs are provided. Only non-marking
            indoor shoes are allowed on the pitch.
          </p>
        </div>

        <div className={styles.infoBlock}>
          <CircleOff size={18} />

          <h4>Cancellations</h4>

          <p>
            Free cancellation up to 48 hours before your booking.
            Late cancellations incur a 50% fee.
          </p>
        </div>
      </motion.div>
    </div>
  );
}