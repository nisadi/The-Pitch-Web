"use client";

import { useState } from "react";
import styles from "./booking.module.css";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  ShieldCheck,
  Info,
  ChevronLeft,
  ChevronRight,
  Circle
} from "lucide-react";
import Link from "next/link";

const BookingPage = () => {
  const initialDate = new Date(2026, 2, 26); // March 26, 2026

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: false, amount: 0.1 },
    transition: { duration: 0.6, ease: "easeOut" }
  };
  
  const [selectedSport, setSelectedSport] = useState("FOOTBALL");
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedLocation, setSelectedLocation] = useState("Maharagama");
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM - 11:00 AM");

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const sports = [
    { id: "cricket", name: "CRICKET", icon: "🏏", image: "/images/hero-stadium.png" },
    { id: "football", name: "FOOTBALL", icon: "⚽", image: "/images/facility-courts.png" },
    { id: "futsal", name: "FUTSAL", icon: "🏃", image: "/images/hero-stadium.png" },
    { id: "cricksal", name: "CRICKSAL", icon: "🥅", image: "/images/facility-courts.png" },
  ];

  const locations = ["Maharagama", "Attidiya", "Moratuwa", "Kottawa"];

  const timeSlots = [
    { time: "08:00 AM - 09:00 AM", status: "taken" },
    { time: "09:00 AM - 10:00 AM", status: "taken" },
    { time: "10:00 AM - 11:00 AM", status: "available" },
    { time: "11:00 AM - 12:00 PM", status: "available" },
    { time: "12:00 PM - 01:00 PM", status: "available" },
    { time: "01:00 PM - 02:00 PM", status: "available" },
    { time: "02:00 PM - 03:00 PM", status: "available" },
    { time: "03:00 PM - 04:00 PM", status: "available" },
    { time: "04:00 PM - 05:00 PM", status: "available" },
    { time: "05:00 PM - 06:00 PM", status: "available" },
  ];

  return (
    <div className={styles.container}>
      {/* Top Status Bar */}
      <motion.div {...fadeInUp} className={styles.statusBar}>
        <div className={styles.statusItem}>
          <div className={styles.indicator} />
          <span>FACILITY STATUS: 100% OPERATIONAL</span>
        </div>
        <div className={styles.statusItem}>ACTIVE COURTS: 5/8</div>
        <div className={styles.statusItem}>INDOOR TEMP: 68°F</div>
        <div className={styles.statusItem}>PEAK HOURS: 5PM - 9PM</div>
      </motion.div>

      <div className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          {/* Sport Selection */}
          <motion.section {...fadeInUp} className={styles.section}>
            <h2 className={styles.sectionTitle}>SELECT YOUR SPORT</h2>
            <div className={styles.sportGrid}>
              {sports.map((sport) => (
                <div
                  key={sport.id}
                  className={`${styles.sportCard} ${selectedSport === sport.name ? styles.activeSport : ""}`}
                  onClick={() => setSelectedSport(sport.name)}
                >
                  <img src={sport.image} alt={sport.name} />
                  <div className={styles.sportOverlay}>
                    <span>{sport.icon} {sport.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <div className={styles.row}>
            {/* Date Selection */}
            <motion.section {...fadeInUp} className={`${styles.section} ${styles.dateSection}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Select Date</h2>
                <div className={styles.calendarNav}>
                  <span>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                  <div className={styles.navBtns}>
                    <ChevronLeft size={16} onClick={handlePrevMonth} style={{cursor: 'pointer'}} />
                    <ChevronRight size={16} onClick={handleNextMonth} style={{cursor: 'pointer'}} />
                  </div>
                </div>
              </div>
              <div className={styles.calendarGrid}>
                {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map(day => (
                  <div key={day} className={styles.dayName}>{day}</div>
                ))}
                {[...Array(firstDay)].map((_, i) => (
                  <div key={`empty-${i}`} className={styles.day}></div>
                ))}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const isSelected = 
                    selectedDate.getDate() === day && 
                    selectedDate.getMonth() === currentMonth.getMonth() && 
                    selectedDate.getFullYear() === currentMonth.getFullYear();
                  const isDimmed = false;
                  return (
                    <div
                      key={day}
                      className={`${styles.day} ${isSelected ? styles.selectedDay : ""} ${isDimmed ? styles.dimmedDay : ""}`}
                      onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                    >
                      {day < 10 ? `0${day}` : day}
                    </div>
                  );
                })}
              </div>
            </motion.section>

            {/* Location Selection */}
            <motion.section {...fadeInUp} className={`${styles.section} ${styles.locationSection}`}>
              <h2 className={styles.sectionTitle}>Location</h2>
              <div className={styles.locationList}>
                {locations.map((loc) => (
                  <div
                    key={loc}
                    className={`${styles.locationItem} ${selectedLocation === loc ? styles.activeLocation : ""}`}
                    onClick={() => setSelectedLocation(loc)}
                  >
                    <div className={styles.radio}>
                      {selectedLocation === loc ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </div>
                    <span>{loc}</span>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Slots Selection */}
          <motion.section {...fadeInUp} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>AVAILABLE SLOTS</h2>
              <div className={styles.legend}>
                <div className={styles.legendItem}><div className={`${styles.dot} ${styles.dotSelected}`} /> SELECTED</div>
                <div className={styles.legendItem}><div className={`${styles.dot} ${styles.dotTaken}`} /> TAKEN</div>
                <div className={styles.legendItem}><div className={`${styles.dot} ${styles.dotAvailable}`} /> AVAILABLE</div>
              </div>
            </div>
            <div className={styles.slotGrid}>
              {timeSlots.map((slot, i) => {
                const isSelected = selectedSlot === slot.time;
                const slotClass = isSelected ? styles.selected : styles[slot.status];
                return (
                  <div
                    key={i}
                    className={`${styles.slot} ${slotClass}`}
                    onClick={() => slot.status !== "taken" && setSelectedSlot(slot.time)}
                  >
                    {slot.time}
                  </div>
                );
              })}
            </div>
          </motion.section>
        </div>

        {/* Sidebar */}
        <motion.aside {...fadeInUp} className={styles.sidebar}>
          <div className={styles.sessionCard}>
            <div className={styles.sidebarHeader}>
              <div className={styles.cartIcon}>🛒</div>
              <h3>YOUR SESSION</h3>
            </div>

            <div className={styles.sessionInfo}>
              <div className={styles.infoGroup}>
                <label>SPORT & LOCATION</label>
                <div className={styles.infoRow}>
                  <span>{selectedSport} - {selectedLocation}</span>
                  <button className={styles.changeBtn}>CHANGE</button>
                </div>
              </div>

              <div className={styles.infoGroup}>
                <label>SCHEDULE</label>
                <div className={styles.infoRow}>
                  <div>
                    <strong>{selectedDate.getDate()} {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}</strong>
                    <p>{selectedSlot} (1 Hour)</p>
                  </div>
                  <CalendarIcon size={20} className={styles.mutedIcon} />
                </div>
              </div>
            </div>

            <div className={styles.pricing}>
              <div className={styles.priceRow}>
                <span>Base Rate</span>
                <span>Rs. 3000.00</span>
              </div>
              <div className={styles.priceRow}>
                <span>Facility Tax (5%)</span>
                <span>Rs. 500.00</span>
              </div>
              <div className={styles.totalRow}>
                <span>TOTAL PRICE</span>
                <span className={styles.totalPrice}>Rs. 3500.00</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className={styles.checkoutBtn}
              onClick={() => {
                const bookingData = {
                  sport: selectedSport,
                  location: selectedLocation,
                  date: selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }),
                  time: selectedSlot,
                  price: "Rs. 3500.00",
                  ref: `#TP-${Math.floor(10000 + Math.random() * 90000)}-X`
                };
                sessionStorage.setItem("currentBooking", JSON.stringify(bookingData));
              }}
            >
              PROCEED TO CHECKOUT
            </Link>

            <div className={styles.secureBadge}>
              <ShieldCheck size={14} />
              <span>SECURE ATHLETE PAYMENT</span>
            </div>

            <div className={styles.concierge}>
              <div className={styles.conciergeIcon}><Info size={16} /></div>
              <div>
                <strong>{selectedSport.toUpperCase()} - {selectedLocation.toUpperCase()}</strong>
                <p>Call our concierge at (555) 012-3456 for team reservations.</p>
              </div>
            </div>
          </div>

          <div className={styles.rulesCard}>
            <h4>FACILITY RULES</h4>
            <ul className={styles.rulesList}>
              <li><CheckCircle2 size={16} /> Non-marking indoor shoes only</li>
              <li><CheckCircle2 size={16} /> Arrival 15 mins before kick-off</li>
              <li><CheckCircle2 size={16} /> 24h cancellation for full refund</li>
            </ul>
          </div>
        </motion.aside>
      </div>
    </div>
  );
};

export default BookingPage;
