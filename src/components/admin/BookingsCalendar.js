"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import {
  BOOKING_STATUSES,
  filterByLocation,
  getBookingsForDate,
  mockBookings,
  toDateKey,
} from "./bookingsData";
import {
  dateFromKey,
  formatHeaderRange,
  formatHourLabel,
  formatOperationalHoursDisplay,
  formatShortDate,
  getOperationalHours,
  getWeekDateKeys,
  parseTimeStart,
  sortBookingsByTime,
} from "./bookingsUtils";
import { useAdminLocation } from "./adminLocationContext";
import { useAdminSettings } from "./settings/adminSettingsContext";
import styles from "./BookingsCalendar.module.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const VIEWS = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "agenda", label: "Agenda" },
];

function BookingCard({ booking }) {
  const status = BOOKING_STATUSES[booking.status];

  return (
      <div
        className={styles.inlineBooking}
        style={{ borderLeftColor: status.color }}
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
          {booking.time} · {booking.court} · {booking.customer}
        </p>
        <p className={styles.inlineBookingMeta}>
          <MapPin size={11} /> {booking.location}
        </p>
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
  const { filterValue: locationFilter, locationId } = useAdminLocation();
  const { locations } = useAdminSettings();

  const activeLocation = useMemo(
    () => locations.find((loc) => loc.id === locationId),
    [locations, locationId]
  );

  const calendarHours = useMemo(
    () =>
      getOperationalHours(
        activeLocation?.operationalStart,
        activeLocation?.operationalEnd
      ),
    [activeLocation]
  );

  const filteredBookings = useMemo(
    () => filterByLocation(mockBookings, locationFilter),
    [locationFilter]
  );

  const weekDateKeys = useMemo(
    () => getWeekDateKeys(focusDate),
    [focusDate]
  );

  const headerTitle = formatHeaderRange(calendarView, focusDate);

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
                const isSelected = selectedDate === dateKey;
                const isToday = todayKey === dateKey;

                return (
                  <button
                    key={dateKey + (outside ? "-out" : "")}
                    type="button"
                    disabled={outside}
                    className={[
                      styles.dayCell,
                      outside ? styles.dayCellOutside : "",
                      isToday ? styles.dayCellToday : "",
                      isSelected ? styles.dayCellSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => !outside && selectDate(dateKey)}
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
              {calendarHours.flatMap((hour) => [
                <div key={`time-${hour}`} className={styles.timeLabel}>
                  {formatHourLabel(hour)}
                </div>,
                ...weekDateKeys.map((dateKey) => {
                    const slotBookings = getBookingsForDate(
                      filteredBookings,
                      dateKey
                    ).filter(
                      (b) => Math.floor(parseTimeStart(b.time) / 60) === hour
                    );
                    return (
                      <div key={`${dateKey}-${hour}`} className={styles.weekCell}>
                        {slotBookings.map((b) => {
                          const status = BOOKING_STATUSES[b.status];
                          return (
                            <div
                              key={b.id}
                              className={styles.weekBooking}
                              style={{
                                borderLeftColor: status.color,
                              }}
                              title={`${b.sport} - ${b.customer}`}
                              onClick={() => selectDate(dateKey)}
                              onKeyDown={() => {}}
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
              ])}
            </div>
          </div>
        )}

        {calendarView === "day" && (
          <div className={styles.daySchedule}>
            {calendarHours.map((hour) => {
              const slotBookings = dayViewBookings.filter(
                (b) => Math.floor(parseTimeStart(b.time) / 60) === hour
              );
              return (
                <div key={hour} className={styles.dayRow}>
                  <div className={styles.dayHour}>{formatHourLabel(hour)}</div>
                  <div className={styles.daySlot}>
                    {slotBookings.length === 0 ? (
                      <span className={styles.emptyState} style={{ padding: "0.5rem 0" }}>
                        —
                      </span>
                    ) : (
                      slotBookings.map((b) => (
                        <BookingCard key={b.id} booking={b} />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {calendarView === "agenda" && (
          <div className={styles.agendaList}>
            {agendaDays.length === 0 ? (
              <p className={styles.emptyState}>
                No bookings this week at {locationFilter}.
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
                        <div key={b.id} className={styles.agendaRow}>
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
    </div>
  );
}
