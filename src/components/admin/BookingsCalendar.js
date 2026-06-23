"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Plus } from "lucide-react";
import {
  BOOKING_STATUSES,
  filterByLocation,
  getBookingsForDate,
  toDateKey,
} from "./bookingsData";
import {
  dateFromKey,
  formatHeaderRange,
  formatHourLabel,
  formatOperationalHoursDisplay,
  formatShortDate,
  bookingOverlapsHour,
  dayRowMinHeightForBooking,
  DAY_VIEW_ROW_BASE_PX,
  getBookingStartHour,
  getOperationalHours,
  getOperationalHoursForDay,
  getWeekDateKeys,
  sortBookingsByTime,
} from "./bookingsUtils";
import { useAdminLocation } from "./adminLocationContext";
import { useAdminSettings } from "./settings/adminSettingsContext";
import AdminCalendarPitchSelect from "./AdminCalendarPitchSelect";
import AddBookingModal from "./AddBookingModal";
import {
  readStoredCalendarPitchId,
  writeStoredCalendarPitchId,
} from "@/lib/admin/calendarPitchStorage";
import { getActivePitchesForLocation } from "@/lib/pitches/pitchMapper";
import BookingDetailModal from "./BookingDetailModal";
import {
  fetchCalendarBookings,
  subscribeToBookingsCalendar,
} from "@/lib/bookings/bookingCalendarData";
import { isPastDateKey } from "@/lib/booking/bookingSlots";
import { isAdminRangeBookable } from "@/lib/bookings/bookingRange";
import {
  cancelCalendarBookingClient,
  createCalendarBookingClient,
} from "@/lib/bookings/bookingMutations";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { resolveCalendarLocation } from "@/lib/locations/resolveAdminLocation";
import { dateKeyToDateId } from "@/lib/locations/locationTimeMapper";
import styles from "./BookingsCalendar.module.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const VIEWS = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Agenda" },
];

function BookingCard({ booking, onSelect, variant = "default" }) {
  const status = BOOKING_STATUSES[booking.status];
  const isDay = variant === "day";

  return (
    <div
      className={
        isDay ?
          `${styles.inlineBooking} ${styles.inlineBookingDay}`
          : styles.inlineBooking
      }
      style={{ borderLeftColor: status.color }}
      role="button"
      tabIndex={0}
      title={
        booking.customer
          ? `${booking.sport} - ${booking.customer}`
          : booking.sport
      }
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(booking);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onSelect?.(booking);
        }
      }}
    >
      <div className={styles.inlineBookingTop}>
        <strong>{booking.sport}</strong>
        <span
          className={styles.statusBadge}
          style={{ color: status.color, background: `${status.color}22` }}
        >
          {status.label}
        </span>
      </div>
      <p className={styles.inlineBookingMeta}>
        {booking.time} · {booking.court}
        {booking.customer ? ` · ${booking.customer}` : ""}
      </p>
      {!isDay ? (
        <p className={styles.inlineBookingMeta}>
          <MapPin size={11} /> {booking.location}
        </p>
      ) : null}
    </div>
  );
}

export default function BookingsCalendar() {
  const today = new Date();
  const todayKey = toDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const [calendarView, setCalendarView] = useState("month");
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [bookings, setBookings] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bookingDraft, setBookingDraft] = useState({
    dateKey: "",
    startHour: null,
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);
  const [detailSubmitting, setDetailSubmitting] = useState(false);
  const { filterValue: locationFilter, locationId } = useAdminLocation();
  const { locations, sports, pitches: settingsPitches } = useAdminSettings();
  const [calendarLocation, setCalendarLocation] = useState(null);
  const [selectedPitchId, setSelectedPitchId] = useState("");

  useEffect(() => {
    let cancelled = false;

    resolveCalendarLocation(locations, {
      locationId,
      filterValue: locationFilter,
    }).then((resolved) => {
      if (!cancelled) setCalendarLocation(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [locations, locationId, locationFilter]);

  const activeLocation = calendarLocation;

  const locationPitches = useMemo(
    () => getActivePitchesForLocation(settingsPitches, activeLocation),
    [settingsPitches, activeLocation]
  );

  const selectedPitch = useMemo(
    () =>
      locationPitches.find(
        (p) =>
          String(p.id) === String(selectedPitchId) ||
          String(p.dbId) === String(selectedPitchId)
      ) ?? null,
    [locationPitches, selectedPitchId]
  );

  useEffect(() => {
    if (!activeLocation?.dbId) {
      setSelectedPitchId("");
      return;
    }

    const ids = locationPitches.map((p) => String(p.dbId ?? p.id));
    if (!ids.length) {
      setSelectedPitchId("");
      return;
    }

    const stored = readStoredCalendarPitchId(activeLocation.dbId);
    const next =
      stored && ids.includes(stored) ? stored : ids[0];
    setSelectedPitchId(next);
  }, [activeLocation?.dbId, locationPitches]);

  const handleSelectPitch = useCallback(
    (pitchId) => {
      setSelectedPitchId(pitchId);
      if (activeLocation?.dbId) {
        writeStoredCalendarPitchId(activeLocation.dbId, pitchId);
      }
    },
    [activeLocation?.dbId]
  );

  // calendarHours: derive from openTimeMappings for the currently viewed day.
  // Returns [] when no open hours are configured for that day — the UI will
  // show an appropriate "not open" message rather than empty time rows.
  const calendarHours = useMemo(() => {
    const openMappings = activeLocation?.openTimeMappings;
    if (!openMappings) return [];

    // For day/week/agenda views use selectedDate; month view falls back to today.
    const dateKey = selectedDate || toDateKey(
      focusDate.getFullYear(),
      focusDate.getMonth(),
      focusDate.getDate()
    );
    const dateId = dateKeyToDateId(dateKey);
    return getOperationalHoursForDay(openMappings, dateId);
  }, [activeLocation, selectedDate, focusDate]);

  const filteredBookings = useMemo(() => {
    let list = filterByLocation(bookings, locationFilter).filter(
      (b) => b.bookingStatus !== "cancelled"
    );
    if (selectedPitchId) {
      list = list.filter(
        (b) => b.pitchId && String(b.pitchId) === String(selectedPitchId)
      );
    }
    return list;
  }, [bookings, locationFilter, selectedPitchId]);

  const calendarRange = useMemo(() => {
    const year = focusDate.getFullYear();
    const month = focusDate.getMonth();
    const from = toDateKey(year, month, 1);
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = toDateKey(year, month, lastDay);
    const padWeek = 7;
    const fromDate = dateFromKey(from);
    fromDate.setDate(fromDate.getDate() - padWeek);
    const toDate = dateFromKey(to);
    toDate.setDate(toDate.getDate() + padWeek);
    return {
      from: toDateKey(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate()
      ),
      to: toDateKey(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate()
      ),
    };
  }, [focusDate]);

  const loadBookings = useCallback(async () => {
    if (!activeLocation?.dbId) {
      setBookings([]);
      return;
    }

    const rows = await fetchCalendarBookings({
      locationDbId: activeLocation.dbId,
      fromDate: calendarRange.from,
      toDate: calendarRange.to,
    });
    setBookings(rows);
  }, [activeLocation?.dbId, calendarRange.from, calendarRange.to]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (!activeLocation?.dbId) return undefined;

    const unsubscribe = subscribeToBookingsCalendar(
      {
        locationDbId: activeLocation.dbId,
        fromDate: calendarRange.from,
        toDate: calendarRange.to,
      },
      setBookings
    );

    return unsubscribe;
  }, [activeLocation?.dbId, calendarRange.from, calendarRange.to]);

  const upsertBookingInList = (updated) => {
    if (!updated) return;
    setBookings((prev) => {
      const next = prev.filter((b) => b.id !== updated.id);
      return [...next, updated];
    });
    setDetailBooking((current) =>
      current?.id === updated.id ? updated : current
    );
  };

  const openBookingDetail = (booking) => {
    setDetailBooking(booking);
  };

  const closeBookingDetail = () => {
    setDetailBooking(null);
  };

  const sendCancellationSms = async (booking) => {
    const phone = String(booking?.customerPhone ?? "").trim();
    if (!phone || booking?.bookingStatus === "blocked") return;

    try {
      const smsRes = await fetch("/api/admin/bookings/send-cancellation-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          customerName: booking.customer,
          reference: booking.reference,
          date: booking.date,
          time: booking.time,
          location: booking.location,
          sport: booking.sport,
          court: booking.court,
        }),
      });
      const smsResult = await smsRes.json();
      if (!smsRes.ok || !smsResult.success) {
        if (!smsResult.skipped) {
          console.warn("[booking cancel SMS]", smsResult.error);
          window.alert(
            `Booking cancelled, but the SMS could not be sent: ${smsResult.error ?? "Unknown error"}`
          );
        }
      }
    } catch (smsErr) {
      console.warn("[booking cancel SMS]", smsErr);
      window.alert(
        `Booking cancelled, but the SMS could not be sent: ${smsErr?.message ?? "Network error"}`
      );
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const bookingSnapshot = detailBooking;
    const isBlock = bookingSnapshot?.bookingStatus === "blocked";
    setDetailSubmitting(true);
    try {
      let errorMessage = null;

      if (isSupabaseConfigured()) {
        const clientResult = await cancelCalendarBookingClient(bookingId);
        if (clientResult.booking) {
          setBookings((prev) => prev.filter((b) => b.id !== bookingId));
          closeBookingDetail();
          if (!isBlock) {
            await sendCancellationSms(bookingSnapshot);
          }
          window.alert(
            isBlock
              ? "Block removed. The slot is available again."
              : "Booking cancelled. The slot is available again."
          );
          return;
        }
        errorMessage = clientResult.error;
      }

      if (!errorMessage) {
        const res = await fetch(`/api/admin/bookings/${bookingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel" }),
        });
        const payload = await res.json();
        if (res.ok && payload.booking) {
          setBookings((prev) => prev.filter((b) => b.id !== bookingId));
          closeBookingDetail();
          if (!isBlock) {
            await sendCancellationSms(bookingSnapshot);
          }
          window.alert(
            isBlock
              ? "Block removed. The slot is available again."
              : "Booking cancelled. The slot is available again."
          );
          return;
        }
        errorMessage = payload.error ?? "Could not cancel booking.";
      }

      window.alert(errorMessage);
    } catch (err) {
      window.alert(err?.message ?? "Could not cancel booking.");
    } finally {
      setDetailSubmitting(false);
    }
  };

  const handleRescheduleBooking = async (bookingId, form) => {
    setDetailSubmitting(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          booking_date: form.booking_date,
          start_hour: Number(form.start_hour),
          end_hour: Number(form.end_hour),
          sport_id: form.sport_id,
          pitch_id: form.pitch_id,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        window.alert(payload.error ?? "Could not reschedule booking.");
        return;
      }
      upsertBookingInList(payload.booking);
      if (payload.booking?.date) {
        setSelectedDate(payload.booking.date);
        setFocusDate(dateFromKey(payload.booking.date));
      }
    } catch (err) {
      window.alert(err?.message ?? "Could not reschedule booking.");
    } finally {
      setDetailSubmitting(false);
    }
  };

  const handleAddBooking = async (form) => {
    if (!activeLocation?.dbId) {
      window.alert(
        "This location is not saved to the database yet. Save it in Admin → Settings → Locations first."
      );
      return;
    }

    const start = Number(form.start_hour);
    const end = Number(form.end_hour) || start + 1;
    const dayBookings = getBookingsForDate(filteredBookings, form.booking_date);

    if (
      isPastDateKey(form.booking_date) ||
      !isAdminRangeBookable(form.booking_date, start, end, dayBookings)
    ) {
      window.alert(
        "Cannot book or block a past time, or a range that overlaps another booking."
      );
      return;
    }

    setSubmittingBooking(true);
    try {
      const requestBody = {
        type: form.type,
        location_id: activeLocation.dbId,
        sport_id: form.sport_id,
        pitch_id: form.pitch_id,
        booking_date: form.booking_date,
        start_hour: start,
        end_hour: end,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        total_amount: form.total_amount,
        remark: form.remark,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        final_amount: form.final_amount,
      };

      let booking = null;
      let errorMessage = null;

      if (isSupabaseConfigured()) {
        const clientResult = await createCalendarBookingClient(requestBody);
        if (clientResult.booking) {
          booking = clientResult.booking;
        } else {
          errorMessage = clientResult.error;
        }
      }

      if (!booking && !errorMessage) {
        const res = await fetch("/api/admin/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        const payload = await res.json();
        if (res.ok && payload.booking) {
          booking = payload.booking;
        } else {
          errorMessage = payload.error ?? "Could not save booking.";
        }
      }

      if (!booking) {
        window.alert(
          errorMessage ??
          "Could not save booking. Apply migration 00036_bookings_admin_anon_mutations.sql or set SUPABASE_SERVICE_ROLE_KEY."
        );
        return;
      }

      setBookings((prev) => {
        const next = prev.filter((b) => b.id !== booking.id);
        return [...next, booking];
      });

      closeAddBookingModal();
      if (form.booking_date) {
        setSelectedDate(form.booking_date);
        setFocusDate(dateFromKey(form.booking_date));
      }

      if (form.type === "block") {
        window.alert(
          "Slot blocked. It will stay unavailable until you cancel the block."
        );
      } else {
        const phone = String(form.customer_phone ?? "").trim();
        if (phone) {
          try {
            const smsRes = await fetch(
              "/api/admin/bookings/send-confirmation-sms",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  phone,
                  customerName: form.customer_name,
                  reference: booking.reference,
                  date: booking.date,
                  time: booking.time,
                  location: booking.location,
                  sport: booking.sport,
                  court: booking.court,
                  totalAmount: booking.totalAmount,
                  remark: form.remark,
                  discountType: form.discount_type,
                  discountValue: form.discount_value,
                  finalAmount: form.final_amount,
                }),
              }
            );
            const smsResult = await smsRes.json();
            if (!smsRes.ok || !smsResult.success) {
              if (!smsResult.skipped) {
                console.warn("[booking SMS]", smsResult.error);
                window.alert(
                  `Booking saved, but the confirmation SMS could not be sent: ${smsResult.error ?? "Unknown error"}`
                );
              }
            }
          } catch (smsErr) {
            console.warn("[booking SMS]", smsErr);
            window.alert(
              `Booking saved, but the confirmation SMS could not be sent: ${smsErr?.message ?? "Network error"}`
            );
          }
        }

        const email = String(form.customer_email ?? "").trim();
        if (email) {
          try {
            const emailRes = await fetch("/api/send-booking-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email,
                fullName: form.customer_name || "there",
                booking: {
                  ref: booking.reference,
                  sport: booking.sport,
                  location: booking.location,
                  date: booking.date,
                  time: booking.time,
                  amount: booking.totalAmount,
                  remark: form.remark,
                  discountType: form.discount_type,
                  discountValue: form.discount_value,
                  finalAmount: form.final_amount,
                },
              }),
            });
            const emailResult = await emailRes.json();
            if (!emailRes.ok || !emailResult.success) {
              console.warn("[booking Email]", emailResult.error);
              {/*window.alert(
                `Booking saved, but the confirmation email could not be sent.`
              );*/}
            }
          } catch (emailErr) {
            console.warn("[booking Email]", emailErr);
            {/*window.alert(
              `Booking saved, but the confirmation email could not be sent.`
            );*/}
          }
        }
      }
    } catch (err) {
      window.alert(err?.message ?? "Could not save booking.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const weekDateKeys = useMemo(
    () => getWeekDateKeys(focusDate),
    [focusDate]
  );

  const headerTitle = useMemo(() => {
    const base = formatHeaderRange(calendarView, focusDate);
    if (selectedPitch?.name) {
      return `${base} · ${selectedPitch.name}`;
    }
    return base;
  }, [calendarView, focusDate, selectedPitch?.name]);

  const navigatePrev = () => {
    const d = new Date(focusDate);
    if (calendarView === "month") d.setMonth(d.getMonth() - 1);
    else if (calendarView === "day") d.setDate(d.getDate() - 1);
    else d.setDate(d.getDate() - 7);
    setFocusDate(d);
    if (calendarView === "day") {
      setSelectedDate(
        toDateKey(d.getFullYear(), d.getMonth(), d.getDate())
      );
    }
  };

  const navigateNext = () => {
    const d = new Date(focusDate);
    if (calendarView === "month") d.setMonth(d.getMonth() + 1);
    else if (calendarView === "day") d.setDate(d.getDate() + 1);
    else d.setDate(d.getDate() + 7);
    setFocusDate(d);
    if (calendarView === "day") {
      setSelectedDate(
        toDateKey(d.getFullYear(), d.getMonth(), d.getDate())
      );
    }
  };

  const goToToday = () => {
    setFocusDate(new Date());
    setSelectedDate(todayKey);
  };

  const selectDate = (dateKey) => {
    setSelectedDate(dateKey);
    setFocusDate(dateFromKey(dateKey));
  };

  const openDayView = (dateKey) => {
    selectDate(dateKey);
    setCalendarView("day");
  };

  const openAddBookingModal = (dateKey, startHour = null) => {
    if (!activeLocation?.dbId) {
      window.alert(
        "This location is not linked to the database yet. Open Admin → Settings → Locations, save the venue, then try again."
      );
      return;
    }
    const resolvedDate = dateKey || selectedDate;
    if (resolvedDate) {
      setSelectedDate(resolvedDate);
      setFocusDate(dateFromKey(resolvedDate));
    }
    setBookingDraft({ dateKey: resolvedDate, startHour });
    setAddModalOpen(true);
  };

  const slotDayBookings = (dateKey) =>
    sortBookingsByTime(getBookingsForDate(filteredBookings, dateKey));

  const openSlotBooking = (dateKey, hour) => {
    if (!isAdminRangeBookable(dateKey, hour, hour + 1, slotDayBookings(dateKey))) {
      return;
    }
    openAddBookingModal(dateKey, hour);
  };

  const closeAddBookingModal = () => {
    setAddModalOpen(false);
    setBookingDraft({ dateKey: "", startHour: null });
  };

  const monthDays = useMemo(() => {
    const year = focusDate.getFullYear();
    const month = focusDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      cells.push({
        day,
        dateKey: toDateKey(prevYear, prevMonth, day),
        outside: true,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        dateKey: toDateKey(year, month, day),
        outside: false,
      });
    }

    const remaining = 42 - cells.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let day = 1; day <= remaining; day++) {
      cells.push({
        day,
        dateKey: toDateKey(nextYear, nextMonth, day),
        outside: true,
      });
    }

    return cells;
  }, [focusDate]);

  const agendaDays = useMemo(() => {
    const keys =
      calendarView === "agenda" ? weekDateKeys : weekDateKeys;
    return keys
      .map((dateKey) => ({
        dateKey,
        bookings: sortBookingsByTime(
          getBookingsForDate(filteredBookings, dateKey)
        ),
      }))
      .filter((d) => d.bookings.length > 0);
  }, [weekDateKeys, filteredBookings, calendarView]);

  const dayViewBookings = useMemo(
    () =>
      sortBookingsByTime(
        getBookingsForDate(
          filteredBookings,
          calendarView === "day"
            ? toDateKey(
              focusDate.getFullYear(),
              focusDate.getMonth(),
              focusDate.getDate()
            )
            : selectedDate
        )
      ),
    [filteredBookings, calendarView, focusDate, selectedDate]
  );

  return (
    <div
      className={`${styles.wrapper} ${styles.wrapperFull}`}
    >
      <section className={styles.calendarPanel}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.calendarHeader}>
              <h2>{headerTitle}</h2>
            </div>
            <div className={styles.navBtns}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={navigatePrev}
                aria-label="Previous"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={goToToday}
              >
                <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                  Today
                </span>
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={navigateNext}
                aria-label="Next"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className={styles.toolbarRight}>
            {locationPitches.length >= 2 ? (
              <AdminCalendarPitchSelect
                pitches={locationPitches}
                selectedPitchId={selectedPitchId}
                onSelectPitch={handleSelectPitch}
              />
            ) : null}
            <button
              type="button"
              className={styles.addBookingBtn}
              onClick={() => openAddBookingModal(selectedDate)}
              disabled={!activeLocation?.dbId || !selectedPitchId}
            >
              <Plus size={16} />
              Add booking
            </button>
            <div className={styles.viewTabs}>
              {VIEWS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.viewTab} ${calendarView === id ? styles.viewTabActive : ""}`}
                  onClick={() => {
                    setCalendarView(id);
                    if (id === "day") {
                      setFocusDate(dateFromKey(selectedDate));
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!locationPitches.length && activeLocation?.dbId ? (
          <p className={styles.noPitchHint}>
            No active pitches at this location. Add courts in Admin → Settings →
            Pitches to use the calendar.
          </p>
        ) : null}

        <div className={styles.calendarBody}>
          {calendarView === "month" && (
            <div className={styles.monthView}>
              <div className={styles.weekdays}>
                {WEEKDAYS.map((day) => (
                  <span key={day} className={styles.weekday}>
                    {day}
                  </span>
                ))}
              </div>
              <div className={styles.daysGrid}>
                {monthDays.map(({ day, dateKey, outside }) => {
                  const dayBookings = getBookingsForDate(
                    filteredBookings,
                    dateKey
                  );
                  const isPast = !outside && isPastDateKey(dateKey);
                  const isSelected = !isPast && selectedDate === dateKey;
                  const isToday = todayKey === dateKey;

                  return (
                    <button
                      key={dateKey + (outside ? "-out" : "")}
                      type="button"
                      disabled={outside}
                      className={[
                        styles.dayCell,
                        outside ? styles.dayCellOutside : "",
                        isPast ? styles.dayCellPast : "",
                        isToday ? styles.dayCellToday : "",
                        isSelected ? styles.dayCellSelected : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => !outside && openDayView(dateKey)}
                    >
                      <span className={styles.dayNumber}>{day}</span>
                      {dayBookings.length > 0 && (
                        <>
                          <div className={styles.dayDots}>
                            {dayBookings.slice(0, 3).map((b) => (
                              <span
                                key={b.id}
                                className={styles.dot}
                                style={{
                                  background:
                                    BOOKING_STATUSES[b.status]?.color,
                                }}
                              />
                            ))}
                          </div>
                          {dayBookings.length > 3 && (
                            <span className={styles.dayCount}>
                              +{dayBookings.length - 3}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {calendarView === "week" && (
            <div className={styles.weekGrid}>
              <div className={styles.weekHeader}>
                <div />
                {weekDateKeys.map((dateKey) => {
                  const d = dateFromKey(dateKey);
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === selectedDate;
                  return (
                    <div key={dateKey} className={styles.weekHeaderCell}>
                      <button
                        type="button"
                        className={[
                          isToday ? styles.weekHeaderToday : "",
                          isSelected ? styles.weekHeaderSelected : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => selectDate(dateKey)}
                      >
                        <span>{WEEKDAYS[d.getDay()]}</span>
                        <strong>{d.getDate()}</strong>
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className={styles.weekBody}>
                {calendarHours.length === 0 ? (
                  <div
                    style={{
                      gridColumn: `1 / -1`,
                      padding: "2rem 1rem",
                      textAlign: "center",
                      color: "var(--foreground-muted)",
                      fontSize: "0.88rem",
                    }}
                  >
                    No open hours configured for this day. Set hours in Settings → Locations.
                  </div>
                ) : (
                  calendarHours.flatMap((hour) => [
                    <div key={`time-${hour}`} className={styles.timeLabel}>
                      {formatHourLabel(hour)}
                    </div>,
                    ...weekDateKeys.map((dateKey) => {
                      // Per-day availability: check the location's open mappings for this specific day
                      const dayDateId = dateKeyToDateId(dateKey);
                      const dayHours = getOperationalHoursForDay(
                        activeLocation?.openTimeMappings ?? [],
                        dayDateId
                      );
                      const isClosedThisDay = !dayHours.includes(hour);

                      const dayBookings = getBookingsForDate(
                        filteredBookings,
                        dateKey
                      );
                      const overlapping = dayBookings.filter((b) =>
                        bookingOverlapsHour(b, hour)
                      );
                      const slotBookings = overlapping.filter(
                        (b) => getBookingStartHour(b) === hour
                      );
                      const isAvailable =
                        !isClosedThisDay &&
                        overlapping.length === 0 &&
                        isAdminRangeBookable(
                          dateKey,
                          hour,
                          hour + 1,
                          slotDayBookings(dateKey)
                        );
                      return (
                        <div
                          key={`${dateKey}-${hour}`}
                          className={`${styles.weekCell} ${isClosedThisDay ? styles.weekCellClosed ?? "" : ""
                            } ${isAvailable ? styles.weekCellEmpty : ""
                            } ${!isAvailable && slotBookings.length === 0 && !isClosedThisDay ? styles.weekCellCovered : ""}`}
                          role={isAvailable ? "button" : undefined}
                          tabIndex={isAvailable ? 0 : undefined}
                          title={
                            isClosedThisDay
                              ? "Closed"
                              : isAvailable
                                ? `Book or block ${formatHourLabel(hour)}`
                                : undefined
                          }
                          onClick={() => {
                            if (isAvailable) openSlotBooking(dateKey, hour);
                          }}
                          onKeyDown={(e) => {
                            if (
                              isAvailable &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault();
                              openSlotBooking(dateKey, hour);
                            }
                          }}
                        >
                          {isClosedThisDay ? null : slotBookings.map((b) => {
                            const status = BOOKING_STATUSES[b.status];
                            return (
                              <div
                                key={b.id}
                                className={styles.weekBooking}
                                style={{
                                  borderLeftColor: status.color,
                                }}
                                title={`${b.sport} - ${b.customer}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openBookingDetail(b);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openBookingDetail(b);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                <strong>{b.sport}</strong>
                                {b.time.split("-")[0]}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }),
                  ])
                )}
              </div>
            </div>
          )}

          {calendarView === "day" && (
            <div className={styles.daySchedule}>
              {calendarHours.length === 0 ? (
                <div
                  style={{
                    padding: "3rem 1.5rem",
                    textAlign: "center",
                    color: "var(--foreground-muted)",
                    fontSize: "0.88rem",
                  }}
                >
                  This location has no open hours configured for this day of the week.
                  <br />
                  Set open hours in{" "}
                  <strong>Settings → Locations</strong>.
                </div>
              ) : (
                calendarHours.map((hour) => {
                  const overlapping = dayViewBookings.filter((b) =>
                    bookingOverlapsHour(b, hour)
                  );
                  const slotBookings = overlapping.filter(
                    (b) => getBookingStartHour(b) === hour
                  );
                  const dayDateKey = toDateKey(
                    focusDate.getFullYear(),
                    focusDate.getMonth(),
                    focusDate.getDate()
                  );
                  const isCovered =
                    overlapping.length > 0 && slotBookings.length === 0;
                  const isAvailable =
                    overlapping.length === 0 &&
                    isAdminRangeBookable(
                      dayDateKey,
                      hour,
                      hour + 1,
                      dayViewBookings
                    );
                  const rowMinHeight = slotBookings.reduce(
                    (max, b) => Math.max(max, dayRowMinHeightForBooking(b)),
                    DAY_VIEW_ROW_BASE_PX
                  );

                  return (
                    <div
                      key={hour}
                      className={styles.dayRow}
                      style={slotBookings.length > 0 ? { minHeight: rowMinHeight } : undefined}
                    >
                      <div className={styles.dayHour}>{formatHourLabel(hour)}</div>
                      <div
                        className={[
                          styles.daySlot,
                          isAvailable ? styles.daySlotEmpty : "",
                          isCovered ? styles.daySlotCovered : "",
                          slotBookings.length > 0 ? styles.daySlotBooked : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        role={isAvailable ? "button" : undefined}
                        tabIndex={isAvailable ? 0 : undefined}
                        title={
                          isAvailable
                            ? `Book or block ${formatHourLabel(hour)}`
                            : undefined
                        }
                        onClick={() => {
                          if (isAvailable) openSlotBooking(dayDateKey, hour);
                        }}
                        onKeyDown={(e) => {
                          if (isAvailable && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            openSlotBooking(dayDateKey, hour);
                          }
                        }}
                      >
                        {isAvailable ? (
                          <span className={styles.slotPlaceholder}>
                            <span className={styles.slotPlaceholderShort}>
                              +
                            </span>
                            <span className={styles.slotPlaceholderText}>
                              Book or block
                            </span>
                          </span>
                        ) : null}
                        {slotBookings.map((b) => (
                          <BookingCard
                            key={b.id}
                            booking={b}
                            variant="day"
                            onSelect={openBookingDetail}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {calendarView === "agenda" && (
            <div className={styles.agendaList}>
              {agendaDays.length === 0 ? (
                <p className={styles.emptyState}>
                  No bookings this week
                  {selectedPitch?.name
                    ? ` on ${selectedPitch.name}`
                    : ` at ${locationFilter}`}
                  .
                </p>
              ) : (
                agendaDays.map(({ dateKey, bookings }) => (
                  <div key={dateKey} className={styles.agendaDay}>
                    <div className={styles.agendaDayHeader}>
                      <h3>{formatShortDate(dateKey)}</h3>
                      <span>
                        {bookings.length}{" "}
                        {bookings.length === 1 ? "booking" : "bookings"}
                      </span>
                    </div>
                    <div className={styles.agendaDayBody}>
                      {bookings.map((b) => {
                        const status = BOOKING_STATUSES[b.status];
                        return (
                          <div
                            key={b.id}
                            className={styles.agendaRow}
                            role="button"
                            tabIndex={0}
                            onClick={() => openBookingDetail(b)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openBookingDetail(b);
                              }
                            }}
                          >
                            <span className={styles.agendaTime}>{b.time}</span>
                            <div className={styles.agendaInfo}>
                              <strong>
                                {b.sport} · {b.court}
                              </strong>
                              <span>
                                {b.customer} · {b.location}
                              </span>
                            </div>
                            <span
                              className={styles.statusBadge}
                              style={{
                                color: status.color,
                                background: `${status.color}22`,
                              }}
                            >
                              {status.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        <div className={styles.legend}>
          {activeLocation && (
            <span className={styles.legendItem}>
              <span
                className={styles.dot}
                style={{ background: "var(--primary)" }}
              />
              Hours:{" "}
              {formatOperationalHoursDisplay(
                activeLocation.operationalStart,
                activeLocation.operationalEnd
              )}
            </span>
          )}
          {Object.entries(BOOKING_STATUSES).map(([key, { label, color }]) => (
            <span key={key} className={styles.legendItem}>
              <span className={styles.dot} style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </section>

      <AddBookingModal
        open={addModalOpen}
        onClose={closeAddBookingModal}
        onSubmit={handleAddBooking}
        submitting={submittingBooking}
        location={activeLocation}
        sports={sports}
        slotHours={calendarHours}
        bookingsForCalendar={filteredBookings}
        initialDateKey={bookingDraft.dateKey || selectedDate}
        initialStartHour={bookingDraft.startHour}
        initialPitchId={selectedPitchId}
      />

      <BookingDetailModal
        open={Boolean(detailBooking)}
        booking={detailBooking}
        onClose={closeBookingDetail}
        onCancel={handleCancelBooking}
        onReschedule={handleRescheduleBooking}
        submitting={detailSubmitting}
        location={activeLocation}
        sports={sports}
        slotHours={calendarHours}
        bookingsForCalendar={filteredBookings}
      />
    </div>
  );
}
