"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./checkout.module.css";
import { motion } from "framer-motion";
import {
  ClipboardList,
  CreditCard,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  Target,
  BadgeCent
} from "lucide-react";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("credit");

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: false, amount: 0.1 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  return (
    <div className={styles.container}>
      <motion.header {...fadeInUp} className={styles.header}>
        <h1 className={styles.title}>SECURE CHECKOUT</h1>
        <p className={styles.subtitle}>Finalize your high-performance arena reservation.</p>
      </motion.header>

      <div className={styles.grid}>
        {/* LEFT COLUMN */}
        <motion.div {...fadeInUp} className={styles.leftCol}>
          {/* BOOKING SUMMARY SECTION */}
          <div className={styles.sectionTitle}>
            <ClipboardList size={20} />
            <span>BOOKING SUMMARY</span>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <label><Target size={12} /> SPORT</label>
                <p>Indoor Football - Field 1</p>
              </div>
              <div className={styles.summaryItem}>
                <label><Clock size={12} /> TIME SLOT</label>
                <p>06:00 PM - 08:00 PM</p>
              </div>
              <div className={styles.summaryItem}>
                <label><Calendar size={12} /> DATE</label>
                <p>Friday, Nov 15, 2024</p>
              </div>
              <div className={styles.summaryItem}>
                <label><BadgeCent size={12} /> RATE</label>
                <p>Peak Hour Rate 5000/hr</p>
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD SECTION */}
          <div className={styles.sectionTitle}>
            <CreditCard size={20} />
            <span>PAYMENT METHOD</span>
          </div>

          <div className={styles.paymentMethod}>
            <div className={styles.paymentTabs}>
              <button
                className={`${styles.tab} ${paymentMethod === "credit" ? styles.active : ""}`}
                onClick={() => setPaymentMethod("credit")}
              >
                <CreditCard size={18} />
                Credit/Debit
              </button>
              <button
                className={`${styles.tab} ${paymentMethod === "wallet" ? styles.active : ""}`}
                onClick={() => setPaymentMethod("wallet")}
              >
                <Wallet size={18} />
                Digital Wallet
              </button>
            </div>

            {paymentMethod === "credit" && (
              <div className={styles.cardForm}>
                <div className={styles.formGroup}>
                  <label>CARDHOLDER NAME</label>
                  <div className={styles.inputWrapper}>
                    <input type="text" className={styles.input} placeholder="Enter name on card" />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>CARD NUMBER</label>
                  <div className={styles.inputWrapper}>
                    <input type="text" className={styles.input} placeholder="0000 0000 0000 0000" />
                    <CreditCard size={20} className={styles.inputIcon} />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>EXPIRY DATE</label>
                    <div className={styles.inputWrapper}>
                      <input type="text" className={styles.input} placeholder="MM/YY" />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>CVV</label>
                    <div className={styles.inputWrapper}>
                      <input type="password" className={styles.input} placeholder="123" />
                    </div>
                  </div>
                </div>

                <div className={styles.checkboxRow}>
                  <input type="checkbox" id="saveCard" />
                  <label htmlFor="saveCard">Save card details for faster future bookings</label>
                </div>
              </div>
            )}

            {paymentMethod === "wallet" && (
              <div className={styles.walletMessage}>
                <p>You will be redirected to your digital wallet provider to complete this payment.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT COLUMN */}
        <motion.div {...fadeInUp} className={styles.rightCol}>
          <div className={styles.orderCard}>
            <h3 className={styles.orderTitle}>ORDER SUMMARY</h3>

            <div className={styles.orderRow}>
              <span>1 Hour Session</span>
              <strong>Rs. 5000.00</strong>
            </div>

            <div className={styles.orderRow}>
              <span>Facility Maintenance Fee</span>
              <strong>Rs. 500.00</strong>
            </div>

            <div className={styles.promoContainer}>
              <span className={styles.promoLabel}>PROMO CODE</span>
              <div className={styles.promoInputGroup}>
                <input type="text" placeholder="Enter code" />
                <button>APPLY</button>
              </div>
              <div className={styles.discountRow}>
                <span>DISCOUNT APPLIED (FIRSTGAME)</span>
                <span>-Rs.500.00</span>
              </div>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.totalSection}>
              <span className={styles.totalLabel}>TOTAL AMOUNT DUE</span>
              <div className={styles.totalValue}>
                <h2>Rs. 5000.00</h2>
                <span>INCLUDES TAXES</span>
              </div>

              <Link href="/booking/confirm" className={styles.payButton}>
                CONFIRM & PAY <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className={styles.guaranteeCard}>
            <div className={styles.guaranteeTitle}>
              <ShieldCheck size={18} />
              PITCH GUARANTEE
            </div>
            <p>
              Full refund if canceled 48 hours prior to play. All payments are encrypted and secure.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
