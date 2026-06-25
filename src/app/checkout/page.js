"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./checkout.module.css";
import { motion } from "framer-motion";
import { resolveSessionPricing } from "@/lib/bookings/resolveSessionPricing";
import { hoursToDbRange } from "@/lib/bookings/bookingRange";
import { calculatePromoDiscount } from "@/lib/promos/validatePromo";
import { getSession } from "@/services/auth";

import {
  ClipboardList,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  Target,
  BadgeCent,
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function formatRs(amount) {
  return `Rs. ${Number(amount).toFixed(2)}`;
}

/**
 * Expands a time range into individual 1-hour slot labels.
 * Prefers numeric startHour/endHour; falls back to parsing the slot string.
 * Returns e.g. ["15:00–16:00", "16:00–17:00"] for a 2-hour block.
 */
function expandTimeSlots(startHour, endHour, slotString) {
  const pad = (n) => String(Math.floor(n)).padStart(2, "0") + ":" + String(Math.round((n % 1) * 60)).padStart(2, "0");

  const start = Number(startHour);
  const end = Number(endHour);

  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    const slots = [];
    for (let h = start; h < end; h++) {
      slots.push(`${pad(h)}–${pad(h + 1)}`);
    }
    return slots;
  }

  // Fallback: return the raw slot string as a single entry
  return [slotString || ""];
}

const SERVICE_CHARGE_RATE = 0.032; // 3.2%

function computeTotals(basePriceNum, discountAmount = 0) {
  const subtotalNum = Number(basePriceNum) || 0;
  const discountNum = Number(discountAmount) || 0;
  const totalAmountNum = Math.max(0, subtotalNum - discountNum);
  const serviceChargeNum = Math.round(totalAmountNum * SERVICE_CHARGE_RATE * 100) / 100;
  const grandTotalNum = Math.round((totalAmountNum + serviceChargeNum) * 100) / 100;

  return {
    subtotalNum,
    discountNum,
    totalAmountNum,
    serviceChargeNum,
    grandTotalNum,
    subtotal: formatRs(subtotalNum),
    total: formatRs(grandTotalNum),
    serviceCharge: formatRs(serviceChargeNum),
    discountFormatted: formatRs(discountNum),
  };
}

function resolvePromoDiscount(appliedPromo, subtotal) {
  if (!appliedPromo) return 0;
  if (appliedPromo.discountType != null) {
    return calculatePromoDiscount(appliedPromo, subtotal);
  }
  return Number(appliedPromo.discountAmount) || 0;
}

function buildBookingStateFromPending(parsed) {
  const pricing = resolveSessionPricing({
    location: parsed.location,
    pitch: parsed.pitch,
    slot: parsed.slot,
    startHour: parsed.startHour,
    endHour: parsed.endHour,
  });

  const subtotalNum = pricing.subtotal;
  const discountNum = resolvePromoDiscount(parsed.appliedPromo, subtotalNum);
  const totals = computeTotals(subtotalNum, discountNum);

  return {
    sportId: parsed.sport?.id,
    locationId: parsed.location?.id,
    pitchId: parsed.pitch?.id ?? parsed.pitch?.dbId ?? null,
    sport: parsed.sport?.name || "Indoor Football",
    location: parsed.location?.name || "Field 1",
    date: parsed.date || "Friday, Nov 15, 2024",
    originalDate: parsed.originalDate,
    time: parsed.slot || "06:00 PM - 08:00 PM",
    startHour: pricing.startHour,
    endHour: pricing.endHour,
    rate: pricing.rateLabel,
    basePrice: formatRs(subtotalNum),
    basePriceNum: subtotalNum,
    subtotalNum: totals.subtotalNum,
    subtotal: totals.subtotal,
    discountNum: totals.discountNum,
    discountFormatted: totals.discountFormatted,
    totalAmountNum: totals.totalAmountNum,
    serviceChargeNum: totals.serviceChargeNum,
    serviceCharge: totals.serviceCharge,
    grandTotalNum: totals.grandTotalNum,
    total: totals.total,
    promoId: parsed.appliedPromo?.id ?? null,
    promoCode: parsed.appliedPromo?.code ?? null,
    ref: `#TP-${Math.floor(10000 + Math.random() * 90000)}-X`,
  };
}

function buildBookingApiPayload(parsed, booking) {
  const startHour = parsed.startHour ?? booking.startHour;
  const endHour = parsed.endHour ?? booking.endHour;

  let start_time;
  let end_time;
  if (Number.isFinite(Number(startHour)) && Number.isFinite(Number(endHour))) {
    ({ start_time, end_time } = hoursToDbRange(startHour, endHour));
  } else {
    const timeParts = (parsed.slot || booking.time).split(" - ");
    start_time = timeParts[0]?.trim();
    end_time =
      timeParts.length > 1
        ? timeParts[timeParts.length - 1]?.trim()
        : start_time;
  }

  return {
    sport_id: parsed.sport?.id || booking.sportId,
    location_id: parsed.location?.id || booking.locationId,
    pitch_id: parsed.pitch?.id ?? parsed.pitch?.dbId ?? null,
    booking_date: parsed.originalDate || booking.originalDate,
    start_time,
    end_time,
    subtotal_amount: booking.subtotalNum,
    service_charge_amount: booking.serviceChargeNum ?? 0,
    total_amount: booking.grandTotalNum ?? booking.totalAmountNum,
    promo_id: booking.promoId ?? null,
  };
}

function readPendingBooking() {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem("pendingBooking");
    console.log("[Checkout Diagnostic] readPendingBooking raw stored:", stored);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("[Checkout Diagnostic] readPendingBooking error:", e);
    return null;
  }
}

const DEFAULT_BOOKING = {
  sport: "Indoor Football",
  location: "Field 1",
  date: "Friday, Nov 15, 2024",
  time: "06:00 PM - 08:00 PM",
  rate: "Standard Rate",
  basePrice: "Rs. 0.00",
  basePriceNum: 0,
  total: "Rs. 0.00",
  totalAmountNum: 0,
  ref: "#TP-94821-X",
};

function createInitialBookingState() {
  console.log("[Checkout Diagnostic] createInitialBookingState called");
  const parsed = readPendingBooking();
  const state = parsed ? buildBookingStateFromPending(parsed) : DEFAULT_BOOKING;
  console.log("[Checkout Diagnostic] createInitialBookingState resolved state:", state);
  return state;
}

export default function CheckoutPage() {
  console.log("[Checkout Diagnostic] CheckoutPage rendering");
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [overlayState, setOverlayState] = useState(null); // null | "verifying" | "success" | "failed"
  const [overlayMessage, setOverlayMessage] = useState("");
  const [promoError, setPromoError] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  const [booking, setBooking] = useState(createInitialBookingState);
  const [appliedPromo, setAppliedPromo] = useState(() => {
    const parsed = readPendingBooking();
    return parsed?.appliedPromo ?? null;
  });
  const [promoInput, setPromoInput] = useState(() => {
    const parsed = readPendingBooking();
    return parsed?.appliedPromo?.code ?? "";
  });

  const generateSessionRef = useRef(null);
  const isInitialized = useRef(false);
  const verificationStarted = useRef(false);

  // ─── Check Auth Session on Mount ─────────────────────────────────────────────
  useEffect(() => {
    const checkUserSession = async () => {
      console.log("[Checkout Diagnostic] checkUserSession running");
      const urlParams = new URLSearchParams(window.location.search);
      const result3ds = urlParams.get("result3ds");
      if (result3ds) return;

      const { session } = await getSession();
      console.log("[Checkout Diagnostic] checkUserSession session exists:", !!session);
      if (!session) {
        console.log("[Checkout Diagnostic] No session found, redirecting to login");
        router.push("/login?next=/checkout");
      }
    };
    checkUserSession();
  }, [router]);

  // ─── Load WebXPay Hosted Session scripts ─────────────────────────────────────
  useEffect(() => {
    console.log("[Checkout Diagnostic] init payment gateway effect running, isInitialized:", isInitialized.current);
    if (isInitialized.current) return;

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.body.appendChild(script);
      });

    const init = async () => {
      try {
        await Promise.all([
          loadScript(
            "https://seylan.gateway.mastercard.com/form/version/82/merchant/MPGS00000251/session.js"
          ),
          loadScript("/webxpay.hostedsession.js"),
        ]);

        window.WebxpayTokenizeInit({
          card: {
            number: "#card-number",
            securityCode: "#security-code",
            expiryMonth: "#expiry-month",
            expiryYear: "#expiry-year",
            nameOnCard: "#cardholder-name",
          },
          ready: (GenerateSession) => {
            generateSessionRef.current = GenerateSession;
            isInitialized.current = true;
            setPaymentReady(true);
          },
        });
      } catch {
        setGeneralError("Failed to load payment gateway.");
      }
    };

    init();
  }, []);

  // ─── Handle 3DS redirect-back (result3ds in URL) ─────────────────────────────
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const result3ds = urlParams.get("result3ds");

    if (!result3ds || verificationStarted.current) return;
    verificationStarted.current = true;

    // Clean the URL immediately so a page refresh won't re-trigger
    window.history.replaceState({}, document.title, window.location.pathname);

    const verify = async () => {
      setOverlayState("verifying");
      setOverlayMessage("Verifying your payment…");

      try {
        // Gather booking details from sessionStorage (saved before 3DS redirect)
        const stored = sessionStorage.getItem("pendingBooking");
        const parsed = stored ? JSON.parse(stored) : {};

        const bookingPayload = {
          user_id: parsed.userId || booking.userId,
          ...buildBookingApiPayload(parsed, {
            ...booking,
            subtotalNum: booking.subtotalNum ?? booking.basePriceNum ?? 0,
            totalAmountNum: booking.totalAmountNum ?? booking.basePriceNum ?? 0,
            promoId: parsed.appliedPromo?.id ?? booking.promoId ?? null,
          }),
        };

        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            result3ds,
            booking: bookingPayload,
          }),
        });

        const data = await res.json();

        if (data.verified) {
          if (data.bookingError) {
            setOverlayState("failed");
            setOverlayMessage(`Payment verified but booking failed: ${data.bookingError}. Please contact support.`);
            return;
          }

          // Build confirmation data
          const confirmData = {
            ref: booking.ref,
            badge: `${(parsed.sport?.name || booking.sport).toUpperCase()} COURT`,
            date: parsed.date || booking.date,
            time: parsed.slot || booking.time,
            location: `${parsed.sport?.name || booking.sport} - ${parsed.location?.name || booking.location}`,
            status: "Fully Paid",
            venueTitle: `The Pitch (${parsed.sport?.name || booking.sport})`,
            venueDesc: `Elite level synthetic turf at ${parsed.location?.name || booking.location}, climate-controlled, and HD replay cameras enabled.`,
          };

          sessionStorage.setItem("confirmBooking", JSON.stringify(confirmData));
          sessionStorage.removeItem("pendingBooking");

          setOverlayState("success");
          setOverlayMessage("Booking confirmed! Redirecting…");

          setTimeout(() => {
            router.push("/booking/confirm");
          }, 1500);
        } else {
          setOverlayState("failed");
          setOverlayMessage(
            data.explanation || "Payment could not be verified. Please try again."
          );
        }
      } catch (err) {
        setOverlayState("failed");
        setOverlayMessage(err.message || "An unexpected error occurred.");
      }
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistPromoToPending = (promo) => {
    try {
      const pending = JSON.parse(sessionStorage.getItem("pendingBooking") || "{}");
      if (promo) {
        pending.appliedPromo = promo;
      } else {
        delete pending.appliedPromo;
      }
      sessionStorage.setItem("pendingBooking", JSON.stringify(pending));
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) {
      setPromoError("Please enter a promo code.");
      return;
    }

    if (!booking.locationId) {
      setPromoError("Location is missing from this booking.");
      return;
    }

    setIsApplyingPromo(true);
    setPromoError("");

    try {
      const subtotal = booking.basePriceNum || 0;

      const { session } = await getSession();
      const headers = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          code,
          location_id: booking.locationId,
          booking_date: booking.originalDate,
          subtotal,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setPromoError(data.error || "Invalid promo code.");
        return;
      }

      const promo = {
        id: data.promo.id,
        code: data.promo.code,
        title: data.promo.title,
        discountAmount: data.discountAmount,
        discountType: data.promo.discountType,
        discountValue: data.promo.discountValue,
      };

      const totals = computeTotals(booking.basePriceNum, data.discountAmount);

      setAppliedPromo(promo);
      setBooking((prev) => ({
        ...prev,
        ...totals,
        promoId: promo.id,
        promoCode: promo.code,
      }));
      persistPromoToPending(promo);
    } catch (err) {
      setPromoError(err.message || "Could not apply promo code.");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    const totals = computeTotals(booking.basePriceNum, 0);
    setAppliedPromo(null);
    setPromoError("");
    setBooking((prev) => ({
      ...prev,
      ...totals,
      promoId: null,
      promoCode: null,
    }));
    persistPromoToPending(null);
  };

  // ─── Error display helper ────────────────────────────────────────────────────
  const handleErrors = (error) => {
    const newErrors = {};
    if (error.type === "fields_in_error") {
      if (error.details.cardNumber) newErrors.cardNumber = "Invalid card number";
      if (error.details.expiryMonth || error.details.expiryYear)
        newErrors.expiry = "Invalid expiry";
      if (error.details.securityCode) newErrors.cvv = "Invalid CVV";
    } else {
      setGeneralError(error.details || "System error");
    }
    setErrors(newErrors);
  };

  // ─── Tokenize → call session-pay API → redirect to 3DS ───────────────────────
  const handlePayment = async () => {
    // Check auth before doing anything
    const { session } = await getSession();
    if (!session) {
      setGeneralError("You must be logged in to make a payment.");
      router.push("/login");
      return;
    }

    if (!generateSessionRef.current) {
      setGeneralError("Payment system not ready. Please wait a moment and try again.");
      return;
    }

    setIsSaving(true);
    setErrors({});
    setGeneralError("");

    generateSessionRef.current(
      async (sessionId) => {
        try {
          // Fetch the logged-in user to build the customer payload
          const { session } = await getSession();
          if (!session) {
            router.push("/login");
            return;
          }

          const user = session.user;
          const fullName = user.user_metadata?.full_name || "";
          const nameParts = fullName.trim().split(" ");

          const customer = {
            id: user.id,
            email: user.email,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "User",
            contactNumber: user.user_metadata?.phone_number || "",
            addressLineOne: "",
            city: "",
            postalCode: "",
            country: "Sri Lanka",
          };

          // Call our Next.js backend to initiate WebXPay Session Pay
          const res = await fetch("/api/payments/session-pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session: sessionId,
              amount: booking.grandTotalNum ?? booking.totalAmountNum,
              currency: "LKR",
              customer,
              bookingRef: booking.ref,
            }),
          });

          const data = await res.json();

          if (!res.ok || (data.error && data.type !== "3ds")) {
            throw new Error(data.explanation || "Payment initiation failed.");
          }

          if (data.html3ds_url) {
            const pending = JSON.parse(sessionStorage.getItem("pendingBooking") || "{}");
            pending.userId = user.id;
            if (appliedPromo) pending.appliedPromo = appliedPromo;
            sessionStorage.setItem("pendingBooking", JSON.stringify(pending));

            // Redirect to bank 3DS OTP page
            window.location.href = data.html3ds_url;
          } else if (data.html3ds) {
            const pending = JSON.parse(sessionStorage.getItem("pendingBooking") || "{}");
            pending.userId = user.id;
            if (appliedPromo) pending.appliedPromo = appliedPromo;
            sessionStorage.setItem("pendingBooking", JSON.stringify(pending));

            // Render the HTML form returned by the gateway, which will auto-submit to the bank's 3DS page
            document.open();
            document.write(data.html3ds);
            document.close();
          } else {
            throw new Error("No 3DS redirect URL or HTML form received from payment gateway.");
          }
        } catch (err) {
          setGeneralError(err.message || "An error occurred during payment.");
          setIsSaving(false);
        }
      },
      (error) => {
        setIsSaving(false);
        handleErrors(error);
      }
    );
  };

  // ─── Create the booking in Supabase after payment verification ──────────────
  const processBooking = async () => {
    setIsProcessing(true);

    try {
      const { session } = await getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const stored = sessionStorage.getItem("pendingBooking");
      const parsed = stored ? JSON.parse(stored) : {};

      const bookingRes = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildBookingApiPayload(parsed, {
            ...booking,
            subtotalNum: booking.subtotalNum ?? booking.basePriceNum ?? 0,
            totalAmountNum: booking.totalAmountNum ?? booking.basePriceNum ?? 0,
            promoId: parsed.appliedPromo?.id ?? booking.promoId ?? null,
          })
        ),
      });

      const bookingData = await bookingRes.json();

      if (!bookingRes.ok || bookingData.error) {
        console.error("Booking creation error:", bookingData);
        setOverlayState("failed");
        setOverlayMessage(bookingData.explanation || "Payment was successful but booking creation failed. Please contact support.");
        return;
      }

      const result = bookingData.booking;

      const confirmData = {
        ref: booking.ref,
        badge: `${(parsed.sport?.name || booking.sport).toUpperCase()} COURT`,
        date: parsed.date || booking.date,
        time: parsed.slot || booking.time,
        location: `${parsed.sport?.name || booking.sport} - ${parsed.location?.name || booking.location}`,
        status: "Fully Paid",
        venueTitle: `The Pitch (${parsed.sport?.name || booking.sport})`,
        venueDesc: `Elite level synthetic turf at ${parsed.location?.name || booking.location}, climate-controlled, and HD replay cameras enabled.`,
      };

      sessionStorage.setItem("confirmBooking", JSON.stringify(confirmData));
      sessionStorage.removeItem("pendingBooking");

      setOverlayState("success");
      setOverlayMessage("Booking confirmed! Redirecting…");

      setTimeout(() => {
        router.push("/booking/confirm");
      }, 1500);
    } catch (err) {
      setOverlayState("failed");
      setOverlayMessage(err.message || "An error occurred while confirming your booking.");
    } finally {
      setIsProcessing(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: "easeOut" },
  };

  return (
    <div className={styles.container}>
      {/* ── Processing / Verification Overlay ───────────────────────────── */}
      {overlayState && (
        <div className={styles.overlay}>
          <div className={styles.overlayCard}>
            {overlayState === "verifying" && (
              <>
                <Loader2 className={styles.overlayIconSpin} size={48} />
                <h2 className={styles.overlayTitle}>Processing Payment</h2>
                <p className={styles.overlayMsg}>{overlayMessage}</p>
              </>
            )}
            {overlayState === "success" && (
              <>
                <CheckCircle2 className={styles.overlayIconSuccess} size={48} />
                <h2 className={styles.overlayTitle}>Payment Successful!</h2>
                <p className={styles.overlayMsg}>{overlayMessage}</p>
              </>
            )}
            {overlayState === "failed" && (
              <>
                <XCircle className={styles.overlayIconFailed} size={48} />
                <h2 className={styles.overlayTitle}>Payment Failed</h2>
                <p className={styles.overlayMsg}>{overlayMessage}</p>
                <button
                  className={styles.overlayRetryBtn}
                  onClick={() => {
                    setOverlayState(null);
                    setOverlayMessage("");
                    verificationStarted.current = false;
                  }}
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <motion.header {...fadeInUp} className={styles.header}>
        <h1 className={styles.title}>SECURE CHECKOUT</h1>
        <p className={styles.subtitle}>Finalize your high-performance arena reservation.</p>
      </motion.header>

      <div className={styles.grid}>
        {/* LEFT COLUMN */}
        <motion.div {...fadeInUp} className={styles.leftCol}>
          {/* BOOKING SUMMARY */}
          <div className={styles.sectionTitle}>
            <ClipboardList size={20} />
            <span>BOOKING SUMMARY</span>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <label><Target size={12} /> SPORT</label>
                <p>{booking.sport} - {booking.location}</p>
              </div>
              <div className={styles.summaryItem}>
                <label><Clock size={12} /> TIME SLOT</label>
                {(() => {
                  const slots = expandTimeSlots(booking.startHour, booking.endHour, booking.time);
                  if (slots.length <= 1) {
                    return <p>{slots[0] || booking.time}</p>;
                  }
                  return (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                      {slots.map((s, i) => (
                        <span
                          key={i}
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background: "rgba(163,255,0,0.1)",
                            color: "#000000",
                            border: "1px solid rgba(163,255,0,0.25)",
                            letterSpacing: "0.3px",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div className={styles.summaryItem}>
                <label><Calendar size={12} /> DATE</label>
                <p>{booking.date}</p>
              </div>
              <div className={styles.summaryItem}>
                <label><BadgeCent size={12} /> RATE</label>
                <p>{booking.rate}</p>
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD */}
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
              {/* Digital Wallet — disabled for now
              <button
                className={`${styles.tab} ${paymentMethod === "wallet" ? styles.active : ""}`}
                onClick={() => setPaymentMethod("wallet")}
              >
                <Wallet size={18} />
                Digital Wallet
              </button>
              */}
            </div>

            {paymentMethod === "credit" && (
              <div className={styles.cardForm}>
                <div className={styles.formGroup}>
                  <label>CARDHOLDER NAME</label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="cardholder-name"
                      type="text"
                      className={styles.input}
                      placeholder="Enter name on card"
                      readOnly
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>CARD NUMBER</label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="card-number"
                      type="text"
                      className={styles.input}
                      placeholder="0000 0000 0000 0000"
                      readOnly
                    />
                    <CreditCard size={20} className={styles.inputIcon} />
                  </div>
                  {errors.cardNumber && (
                    <span className={styles.errorText}>{errors.cardNumber}</span>
                  )}
                </div>

                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>EXPIRY DATE</label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="expiry-month"
                        type="text"
                        className={styles.input}
                        placeholder="MM"
                        readOnly
                        style={{ width: "48%", marginRight: "4%" }}
                      />
                      <input
                        id="expiry-year"
                        type="text"
                        className={styles.input}
                        placeholder="YY"
                        readOnly
                        style={{ width: "48%" }}
                      />
                    </div>
                    {errors.expiry && (
                      <span className={styles.errorText}>{errors.expiry}</span>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label>CVV</label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="security-code"
                        type="password"
                        className={styles.input}
                        placeholder="123"
                        readOnly
                      />
                    </div>
                    {errors.cvv && (
                      <span className={styles.errorText}>{errors.cvv}</span>
                    )}
                  </div>
                </div>

                {generalError && (
                  <div className={styles.errorMessage}>
                    <p>{generalError}</p>
                  </div>
                )}

                {/* Security Note */}
                <div className={styles.securityNote}>
                  <Lock size={14} />
                  <span>Your card information is encrypted and secure. We never store full card details.</span>
                </div>
              </div>
            )}

            {/* {paymentMethod === "wallet" && (
              <div className={styles.walletMessage}>
                <p>You will be redirected to your digital wallet provider to complete this payment.</p>
              </div>
            )} */}
          </div>
        </motion.div>

        {/* RIGHT COLUMN */}
        <motion.div {...fadeInUp} className={styles.rightCol}>
          <div className={styles.orderCard}>
            <h3 className={styles.orderTitle}>ORDER SUMMARY</h3>

            <div className={styles.orderRow}>
              <span>Session Fee</span>
              <strong>{booking.basePrice}</strong>
            </div>
            {booking.serviceChargeNum > 0 && (
              <div className={styles.orderRow}>
                <span>Service Charge (3.2%)</span>
                <strong>{booking.serviceCharge}</strong>
              </div>
            )}

            <div className={styles.promoContainer}>
              <span className={styles.promoLabel}>PROMO CODE</span>
              <div className={styles.promoInputGroup}>
                <input
                  type="text"
                  placeholder="Enter code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  disabled={Boolean(appliedPromo) || isApplyingPromo}
                />
                {appliedPromo ? (
                  <button type="button" onClick={handleRemovePromo}>
                    REMOVE
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo}
                  >
                    {isApplyingPromo ? "…" : "APPLY"}
                  </button>
                )}
              </div>
              {promoError && (
                <p className={styles.promoError}>{promoError}</p>
              )}
            </div>

            {appliedPromo && (
              <div className={styles.discountRow}>
                <span>DISCOUNT APPLIED ({appliedPromo.code})</span>
                <span>-{booking.discountFormatted}</span>
              </div>
            )}



            <div className={styles.divider}></div>

            <div className={styles.totalSection}>
              <span className={styles.totalLabel}>TOTAL AMOUNT DUE</span>
              <div className={styles.totalValue}>
                <h2>{booking.total}</h2>
              </div>

              <button
                className={styles.payButton}
                onClick={handlePayment}
                disabled={isProcessing || isSaving || !paymentReady}
              >
                {!paymentReady ? (
                  <>
                    <Loader2 size={18} className={styles.spinIcon} /> LOADING PAYMENT…
                  </>
                ) : isSaving ? (
                  <>
                    <Loader2 size={18} className={styles.spinIcon} /> PROCESSING…
                  </>
                ) : (
                  <>CONFIRM &amp; PAY <ArrowRight size={18} /></>
                )}
              </button>
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

      <style jsx global>{`
        input[readonly] {
          background-color: #f9fafb;
          cursor: text;
        }
        input[readonly] iframe {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}