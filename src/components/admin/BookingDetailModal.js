"use client";

import { useEffect, useId, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { CalendarClock, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { pitchSupportsSport } from "@/lib/pitches/pitchMapper";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatSlotLabelFromDb, hoursToDbRange } from "@/lib/bookings/bookingMapper";
import {
  formatEndHourLabel,
  getRangeDurationHours,
  getValidEndHours,
} from "@/lib/bookings/bookingRange";
import { BOOKING_STATUSES, getBookingsForDate } from "./bookingsData";
import { formatHourLabel, formatShortDate, parseTimeField } from "./bookingsUtils";
import ConfirmDialog from "./ConfirmDialog";
import styles from "./BookingDetailModal.module.css";

const PAYMENT_LABELS = {
  paid: "Paid",
  unpaid: "Unpaid",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
};

export default function BookingDetailModal({
  open,
  booking,
  onClose,
  onCancel,
  onReschedule,
  onMarkPaid,
  location,
  sports = [],
  slotHours = [],
  bookingsForCalendar = [],
  submitting = false,
}) {
  const formId = useId();
  const [showReschedule, setShowReschedule] = useState(false);
  const [pitches, setPitches] = useState([]);
  const checkboxRef = useRef(null);
  const [confirmState, setConfirmState] = useState({ open: false });

  const closeConfirm = () => {
    if (confirmState.onCancel) confirmState.onCancel();
    setConfirmState({ open: false });
  };

  const [rescheduleForm, setRescheduleForm] = useState({
    booking_date: "",
    start_hour: "",
    end_hour: "",
    sport_id: "",
    pitch_id: "",
  });

  const locationSports = useMemo(() => {
    const ids = location?.sportIds ?? [];
    if (!ids.length) return sports;
    return sports.filter(
      (sport) => ids.includes(sport.slug) || ids.includes(sport.id)
    );
  }, [sports, location?.sportIds]);

  const dayBookings = useMemo(
    () =>
      getBookingsForDate(bookingsForCalendar, rescheduleForm.booking_date).filter(
        (b) => b.id !== booking?.id
      ),
    [bookingsForCalendar, rescheduleForm.booking_date, booking?.id]
  );

  const validEndHours = useMemo(() => {
    if (!rescheduleForm.start_hour) return [];
    return getValidEndHours(
      rescheduleForm.booking_date,
      Number(rescheduleForm.start_hour),
      slotHours,
      dayBookings,
      booking?.id
    );
  }, [
    rescheduleForm.booking_date,
    rescheduleForm.start_hour,
    slotHours,
    dayBookings,
    booking?.id,
  ]);

  const reschedulePreview = useMemo(() => {
    const start = Number(rescheduleForm.start_hour);
    const end = Number(rescheduleForm.end_hour);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return null;
    }
    const { start_time, end_time } = hoursToDbRange(start, end);
    return {
      label: formatSlotLabelFromDb(start_time, end_time),
      duration: getRangeDurationHours(start, end),
    };
  }, [rescheduleForm.start_hour, rescheduleForm.end_hour]);

  useEffect(() => {
    if (!open) {
      setShowReschedule(false);
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !booking) return;

    setShowReschedule(false);
    const endHour = parseTimeField(booking.endTime).hour;
    setRescheduleForm({
      booking_date: booking.date,
      start_hour: String(booking.startHour ?? ""),
      end_hour: String(endHour || (booking.startHour ?? 0) + 1),
      sport_id: booking.sportId ?? "",
      pitch_id: booking.pitchId ?? "",
    });
  }, [open, booking]);

  useEffect(() => {
    if (
      !open ||
      !isSupabaseConfigured() ||
      !location?.dbId ||
      !rescheduleForm.sport_id
    ) {
      setPitches([]);
      return;
    }

    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("pitches")
      .select("id, name, sport_id, sport_ids")
      .eq("location_id", location.dbId)
      .eq("is_active", true)
      .order("name")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[BookingDetailModal] pitches", error);
          setPitches([]);
        } else {
          setPitches(
            (data ?? []).filter((pitch) =>
              pitchSupportsSport(pitch, rescheduleForm.sport_id, null)
            )
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, location?.dbId, rescheduleForm.sport_id]);

  useEffect(() => {
    if (!pitches.length) {
      setRescheduleForm((prev) => ({ ...prev, pitch_id: "" }));
      return;
    }

    setRescheduleForm((prev) => {
      const stillValid = pitches.some(
        (pitch) => String(pitch.id) === String(prev.pitch_id)
      );
      if (stillValid) return prev;
      return { ...prev, pitch_id: String(pitches[0].id) };
    });
  }, [pitches]);

  if (!open || !booking) return null;

  const status = BOOKING_STATUSES[booking.status] ?? BOOKING_STATUSES.pending;
  const isCancelled = booking.bookingStatus === "cancelled";
  const canModify = !isCancelled;

  const handleRescheduleSubmit = (event) => {
    event.preventDefault();
    onReschedule(booking.id, {
      booking_date: rescheduleForm.booking_date,
      start_hour: Number(rescheduleForm.start_hour),
      sport_id: rescheduleForm.sport_id,
      pitch_id: rescheduleForm.pitch_id,
    });
  };

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-title`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <h2 id={`${formId}-title`}>
              {booking.sport} · {booking.court}
            </h2>
            <div className={styles.headerMeta}>
              <span>{booking.reference}</span>
              <span>·</span>
              <span>{formatShortDate(booking.date)}</span>
              <span>·</span>
              <span>{booking.time}</span>
              <span
                className={styles.badge}
                style={{
                  color: status.color,
                  background: `${status.color}22`,
                }}
              >
                {status.label}
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.details}>
            <div>
              <span className={styles.detailLabel}>Customer</span>
              {booking.customer || "—"}
            </div>
            <div>
              <span className={styles.detailLabel}>Location</span>
              {booking.location}
            </div>
            {booking.customerPhone ? (
              <div>
                <span className={styles.detailLabel}>Phone</span>
                {booking.customerPhone}
              </div>
            ) : null}
            {booking.customerEmail ? (
              <div>
                <span className={styles.detailLabel}>Email</span>
                {booking.customerEmail}
              </div>
            ) : null}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span className={styles.detailLabel}>Payment</span>
                {PAYMENT_LABELS[booking.paymentStatus] ?? booking.paymentStatus}
              </div>
              {booking.paymentStatus === "unpaid" && canModify ? (
                <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", cursor: "pointer", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    ref={checkboxRef}
                    disabled={submitting}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfirmState({
                          open: true,
                          title: "Mark as paid?",
                          description: "Are you sure you want to mark this booking as paid? This action cannot be undone.",
                          confirmLabel: "Mark as paid",
                          variant: "default",
                          onConfirm: () => onMarkPaid?.(booking.id),
                          onCancel: () => {
                            if (checkboxRef.current) checkboxRef.current.checked = false;
                          }
                        });
                      }
                    }}
                  />
                  Mark as paid
                </label>
              ) : null}
            </div>
            <div>
              <span className={styles.detailLabel}>Amount</span>
              {booking.totalAmount > 0
                ? `LKR ${booking.totalAmount.toLocaleString("en-LK")}`
                : "—"}
            </div>
            {booking.discountType && booking.discountValue > 0 ? (
              <>
                <div>
                  <span className={styles.detailLabel}>Discount</span>
                  {booking.discountType === 1 || booking.discountType === "percentage"
                    ? `${booking.discountValue}%`
                    : `LKR ${booking.discountValue.toLocaleString("en-LK")}`}
                </div>
                <div>
                  <span className={styles.detailLabel}>Final Amount</span>
                  <span style={{ fontWeight: 600, color: "var(--primary, #A3FF00)" }}>
                    LKR {(booking.finalAmount ?? booking.totalAmount).toLocaleString("en-LK")}
                  </span>
                </div>
              </>
            ) : null}
            {booking.remark ? (
              <div className={styles.detailFull} style={{ marginTop: "0.5rem" }}>
                <span className={styles.detailLabel}>Remarks</span>
                <span style={{ whiteSpace: "pre-wrap" }}>{booking.remark}</span>
              </div>
            ) : null}
            <div className={styles.detailFull}>
              <span className={styles.detailLabel}>Time slot</span>
              {booking.time}
            </div>
          </div>

          {showReschedule && canModify ? (
            <form
              className={styles.reschedulePanel}
              onSubmit={handleRescheduleSubmit}
            >
              <h3>Reschedule booking</h3>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${formId}-date`}>
                  New date
                </label>
                <input
                  id={`${formId}-date`}
                  type="date"
                  className={styles.input}
                  required
                  value={rescheduleForm.booking_date}
                  onChange={(e) =>
                    setRescheduleForm((prev) => ({
                      ...prev,
                      booking_date: e.target.value,
                    }))
                  }
                />
              </div>
              <div className={styles.field}>
                <span className={styles.label}>New time range</span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <div className={styles.field} style={{ margin: 0 }}>
                    <label
                      className={styles.label}
                      htmlFor={`${formId}-start`}
                      style={{ fontSize: "0.72rem" }}
                    >
                      Starts
                    </label>
                    <select
                      id={`${formId}-start`}
                      className={styles.input}
                      required
                      value={rescheduleForm.start_hour}
                      onChange={(e) => {
                        const start = e.target.value;
                        const ends = getValidEndHours(
                          rescheduleForm.booking_date,
                          Number(start),
                          slotHours,
                          dayBookings,
                          booking.id
                        );
                        setRescheduleForm((prev) => ({
                          ...prev,
                          start_hour: start,
                          end_hour: ends.length ? String(ends[0]) : "",
                        }));
                      }}
                    >
                      {slotHours.map((hour) => (
                        <option key={hour} value={String(hour)}>
                          {formatHourLabel(hour)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field} style={{ margin: 0 }}>
                    <label
                      className={styles.label}
                      htmlFor={`${formId}-end`}
                      style={{ fontSize: "0.72rem" }}
                    >
                      Ends at
                    </label>
                    <select
                      id={`${formId}-end`}
                      className={styles.input}
                      required
                      value={rescheduleForm.end_hour}
                      disabled={validEndHours.length === 0}
                      onChange={(e) =>
                        setRescheduleForm((prev) => ({
                          ...prev,
                          end_hour: e.target.value,
                        }))
                      }
                    >
                      {validEndHours.map((hour) => (
                        <option key={hour} value={String(hour)}>
                          {formatEndHourLabel(hour)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {reschedulePreview ? (
                  <p
                    style={{
                      marginTop: "0.5rem",
                      marginBottom: 0,
                      fontSize: "0.8rem",
                      color: "var(--foreground-muted)",
                    }}
                  >
                    {reschedulePreview.duration}{" "}
                    {reschedulePreview.duration === 1 ? "hour" : "hours"} ·{" "}
                    {reschedulePreview.label}
                  </p>
                ) : null}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${formId}-sport`}>
                  Sport
                </label>
                <select
                  id={`${formId}-sport`}
                  className={styles.input}
                  required
                  value={rescheduleForm.sport_id}
                  onChange={(e) =>
                    setRescheduleForm((prev) => ({
                      ...prev,
                      sport_id: e.target.value,
                      pitch_id: "",
                    }))
                  }
                >
                  {locationSports.map((sport) => (
                    <option
                      key={sport.dbId ?? sport.id}
                      value={sport.dbId ?? sport.id}
                    >
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`${formId}-pitch`}>
                  Pitch / court
                </label>
                <select
                  id={`${formId}-pitch`}
                  className={styles.input}
                  required={pitches.length > 0}
                  disabled={pitches.length === 0}
                  value={rescheduleForm.pitch_id}
                  onChange={(e) =>
                    setRescheduleForm((prev) => ({
                      ...prev,
                      pitch_id: e.target.value,
                    }))
                  }
                >
                  {pitches.map((pitch) => (
                    <option key={pitch.id} value={pitch.id}>
                      {pitch.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={submitting}
              >
                <CalendarClock size={16} />
                {submitting ? "Saving…" : "Confirm reschedule"}
              </button>
            </form>
          ) : null}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
          {canModify ? (
            <>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowReschedule((v) => !v)}
                disabled={submitting}
              >
                <CalendarClock size={16} />
                {showReschedule ? "Hide reschedule" : "Reschedule"}
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={submitting}
                onClick={() => {
                  window.alert("Refund functionality coming soon.");
                }}
              >
                Refund
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                disabled={submitting}
                onClick={() => {
                  const isBlock = booking.bookingStatus === "blocked";
                  const title = isBlock ? "Remove block?" : "Cancel booking?";
                  const message = isBlock
                    ? "Remove this block? The slot will become available for booking again."
                    : "Cancel this booking? The slot will become available again.";
                  setConfirmState({
                    open: true,
                    title,
                    description: message,
                    confirmLabel: isBlock ? "Remove block" : "Cancel booking",
                    variant: "destructive",
                    onConfirm: () => onCancel(booking.id)
                  });
                }}
              >
                {submitting
                  ? "Working…"
                  : booking.bookingStatus === "blocked"
                    ? "Remove block"
                    : "Cancel booking"}
              </button>
            </>
          ) : null}
        </footer>
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        onClose={closeConfirm}
        onConfirm={() => {
          confirmState.onConfirm?.();
        }}
      />
    </div>,
    document.body
  );
}
