"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import styles from "./RefundConfirmModal.module.css";

/**
 * Refund Confirmation Modal
 * Prompts the user to choose between:
 *   A) Keep the appointment active + process refund
 *   B) Cancel the appointment + process refund
 */
export default function RefundConfirmModal({
  open,
  booking,
  onClose,
  onConfirm, // onConfirm(cancelBooking: boolean)
  submitting = false,
}) {
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, submitting, onClose]);

  if (!open || !booking) return null;

  let amount = booking.finalAmount > 0 ? booking.finalAmount : booking.totalAmount;
  const isCash = booking.paymentMethod === "cash";
  
  // Back out the 3.2% service charge for card payments visually as well
  if (!isCash && amount > 0) {
    amount = Math.round((amount / 1.032) * 100) / 100;
  }
  
  const amountLabel = `LKR ${Number(amount).toLocaleString("en-LK")}`;

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onClick={() => !submitting && onClose()}
    >
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-desc`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <AlertTriangle size={20} />
          </div>
          <div className={styles.headerText}>
            <h2 id={`${id}-title`} className={styles.title}>
              Refund Appointment
            </h2>
            <p id={`${id}-desc`} className={styles.subtitle}>
              Select how the appointment should be handled after refund.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Booking</span>
            <span>{booking.reference}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Customer</span>
            <span>{booking.customer || "—"}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Refund Amount</span>
            <span className={styles.summaryAmount}>{amountLabel}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Method</span>
            <span>{isCash ? "Cash (mark as refunded)" : "Card (gateway refund)"}</span>
          </div>
        </div>

        {/* Options */}
        <div className={styles.options}>
          {/* Option A – Keep */}
          <div className={styles.optionCard}>
            <div className={styles.optionContent}>
              <span className={styles.optionBadge} data-variant="keep">
                Option A
              </span>
              <h3 className={styles.optionTitle}>Keep Appointment</h3>
              <ul className={styles.optionList}>
                <li>Appointment remains active</li>
                <li>Customer receives full refund ({amountLabel})</li>
                <li>Appointment status unchanged</li>
              </ul>
            </div>
            <button
              type="button"
              className={styles.btnKeep}
              onClick={() => onConfirm(false)}
              disabled={submitting}
              id={`${id}-keep-btn`}
            >
              {submitting ? "Processing…" : "Keep Appointment & Refund"}
            </button>
          </div>

          {/* Option B – Cancel */}
          <div className={styles.optionCard}>
            <div className={styles.optionContent}>
              <span className={styles.optionBadge} data-variant="cancel">
                Option B
              </span>
              <h3 className={styles.optionTitle}>Cancel Appointment</h3>
              <ul className={styles.optionList}>
                <li>Appointment marked as cancelled</li>
                <li>Customer receives full refund ({amountLabel})</li>
                <li>Slot becomes available again</li>
              </ul>
            </div>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => onConfirm(true)}
              disabled={submitting}
              id={`${id}-cancel-btn`}
            >
              {submitting ? "Processing…" : "Cancel Appointment & Refund"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={submitting}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
