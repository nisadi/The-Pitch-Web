"use client";

import { useState } from "react";
import styles from "./booking.module.css";
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
  const [selectedSport, setSelectedSport] = useState("Football");
  const [selectedDate, setSelectedDate] = useState("2026-03-26");
  const [selectedLocation, setSelectedLocation] = useState("Maharagama");
  const [selectedSlot, setSelectedSlot] = useState("10:00 AM - 11:00 AM");

  const sports = [
    { id: "cricket", name: "CRICKET", icon: "🏏", image: "/images/hero-stadium.png" },
    { id: "football", name: "FOOTBALL", icon: "⚽", image: "/images/facility-courts.png" },
    { id: "futsal", name: "FUTSAL", icon: "🏃", image: "/images/hero-stadium.png" },
    { id: "cricksal", name: "CRICKSAL", icon: "🥅", image: "/images/facility-courts.png" },
  ];

  const locations = ["Maharagama", "Attidiya", "Moratuwa"];

  const timeSlots = [
    { time: "08:00 AM", status: "taken" },
    { time: "09:00 AM", status: "taken" },
    { time: "10:00 AM - 11.00", status: "selected" },
    { time: "11:00 AM", status: "available" },
    { time: "12:00 AM", status: "available" },
    { time: "1:00 PM", status: "available" },
    { time: "2:00 PM", status: "available" },
    { time: "3:00 PM", status: "available" },
    { time: "4:00 PM", status: "available" },
    { time: "5:00 PM", status: "available" },
  ];

  return (
    <div className={styles.container}>
      {/* Top Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusItem}>
          <div className={styles.indicator} />
          <span>FACILITY STATUS: 100% OPERATIONAL</span>
        </div>
        <div className={styles.statusItem}>ACTIVE COURTS: 5/8</div>
        <div className={styles.statusItem}>INDOOR TEMP: 68°F</div>
        <div className={styles.statusItem}>PEAK HOURS: 5PM - 9PM</div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          {/* Sport Selection */}
          <section className={styles.section}>
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
          </section>

          <div className={styles.row}>
            {/* Date Selection */}
            <section className={`${styles.section} ${styles.dateSection}`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Select Date</h2>
                <div className={styles.calendarNav}>
                  <span>March 26</span>
                  <div className={styles.navBtns}>
                    <ChevronLeft size={16} />
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
              <div className={styles.calendarGrid}>
                {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map(day => (
                  <div key={day} className={styles.dayName}>{day}</div>
                ))}
                {[...Array(31)].map((_, i) => {
                  const day = i + 1;
                  const isSelected = day === 26;
                  const isDimmed = day < 1;
                  return (
                    <div 
                      key={i} 
                      className={`${styles.day} ${isSelected ? styles.selectedDay : ""} ${isDimmed ? styles.dimmedDay : ""}`}
                    >
                      {day < 10 ? `0${day}` : day}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Location Selection */}
            <section className={`${styles.section} ${styles.locationSection}`}>
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
            </section>
          </div>

          {/* Slots Selection */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>AVAILABLE SLOTS</h2>
              <div className={styles.legend}>
                <div className={styles.legendItem}><div className={`${styles.dot} ${styles.dotSelected}`} /> SELECTED</div>
                <div className={styles.legendItem}><div className={`${styles.dot} ${styles.dotTaken}`} /> TAKEN</div>
                <div className={styles.legendItem}><div className={`${styles.dot} ${styles.dotAvailable}`} /> AVAILABLE</div>
              </div>
            </div>
            <div className={styles.slotGrid}>
              {timeSlots.map((slot, i) => (
                <div 
                  key={i} 
                  className={`${styles.slot} ${styles[slot.status]}`}
                  onClick={() => slot.status === "available" && setSelectedSlot(slot.time)}
                >
                  {slot.time}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sessionCard}>
            <div className={styles.sidebarHeader}>
              <div className={styles.cartIcon}>🛒</div>
              <h3>YOUR SESSION</h3>
            </div>

            <div className={styles.sessionInfo}>
              <div className={styles.infoGroup}>
                <label>SPORT</label>
                <div className={styles.infoRow}>
                  <span>{selectedSport} - Pitch 1</span>
                  <button className={styles.changeBtn}>CHANGE</button>
                </div>
              </div>

              <div className={styles.infoGroup}>
                <label>SCHEDULE</label>
                <div className={styles.infoRow}>
                  <div>
                    <strong>{selectedSport} - Pitch 1</strong>
                    <p>10:00 AM (1 Hour)</p>
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

            <Link href="/checkout" className={styles.checkoutBtn}>
              PROCEED TO CHECKOUT
            </Link>

            <div className={styles.secureBadge}>
              <ShieldCheck size={14} />
              <span>SECURE ATHLETE PAYMENT</span>
            </div>

            <div className={styles.concierge}>
              <div className={styles.conciergeIcon}><Info size={16} /></div>
              <div>
                <strong>{selectedSport.toUpperCase()} - PITCH 1</strong>
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
        </aside>
      </div>
    </div>
  );
};

export default BookingPage;
