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

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};

export default function BookingConfirmPage() {
  const [booking, setBooking] = React.useState({
    ref: "#TP-94821-X",
    badge: "PREMIUM COURT",
    date: "Friday, Nov 15, 2024",
    time: "06:00 PM - 08:00 PM",
    location: "Indoor Pitch 4 (Futsal Pro)",
    status: "Fully Paid",
    venueTitle: "The Pitch 4",
    venueDesc: "Elite level synthetic turf, climate-controlled, and HD replay cameras enabled."
  });
  const [isDownloading, setIsDownloading] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem("confirmBooking");
      if (stored) {
        setBooking(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Dynamically load html2canvas and jsPDF from CDN to avoid next.js SSR and build issues
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

      const element = document.getElementById("receipt-card");
      if (!element) return;

      const canvas = await window.html2canvas(element, {
        scale: 2, // High resolution capture
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Receipt-${booking.ref.replace("#", "")}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

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
        <motion.div {...fadeInUp} className={styles.leftCard} id="receipt-card">
          {/* TOP */}
          <div className={styles.referenceTop}>
            <div>
              <span className={styles.refLabel}>
                BOOKING REFERENCE
              </span>

              <h2 className={styles.refNumber}>{booking.ref}</h2>
            </div>

            <div className={styles.badge}>{booking.badge}</div>
          </div>

          {/* DETAILS */}
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                <Calendar size={12} />
                <span>DATE</span>
              </span>

              <span className={styles.detailValue}>
                {booking.date}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                <Clock size={12} />
                <span>TIME SLOT</span>
              </span>

              <span className={styles.detailValue}>
                {booking.time}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                <MapPin size={12} />
                <span>LOCATION</span>
              </span>

              <span className={styles.detailValue}>
                {booking.location}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>
                <ShieldCheck size={12} />
                <span>STATUS</span>
              </span>

              <span
                className={`${styles.detailValue} ${styles.statusPaid}`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          {/* DOWNLOAD */}
          <div className={styles.downloadBtnWrapper} data-html2canvas-ignore="true">
            <button
              className={styles.downloadBtn}
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download size={16} />
              {isDownloading ? "Generating PDF..." : "Download Receipt"}
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
              <h3>{booking.venueTitle}</h3>

              <p>{booking.venueDesc}</p>

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