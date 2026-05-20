'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import styles from './booking.module.css';
import { getSession } from '@/services/auth';

import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { getSports } from '@/services/sports';
import { getLocations } from '@/services/locations';

export default function BookingPage() {
  const router = useRouter();
  const [sports, setSports] = useState([]);
  const [locations, setLocations] = useState([]);

  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [selectedSlot, setSelectedSlot] = useState(
    '10:00 AM - 11:00 AM'
  );

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { session } = await getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      loadData();
    };
    checkAuthAndLoad();
  }, [router]);

  const loadData = async () => {
    const sportsData = await getSports();
    const locationsData = await getLocations();

    setSports(sportsData);
    setLocations(locationsData);

    if (sportsData.length > 0) {
      setSelectedSport(sportsData[0]);
    }

    if (locationsData.length > 0) {
      setSelectedLocation(locationsData[0]);
    }
  };

  const handleCheckout = () => {
    if (!selectedSport || !selectedLocation || !selectedDate || !selectedSlot) {
      alert("Please select all details");
      return;
    }
    const bookingDetails = {
      sport: selectedSport,
      location: selectedLocation,
      date: selectedDate.toDateString(),
      slot: selectedSlot,
      originalDate: selectedDate
    };
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));
    router.push('/checkout');
  };

  const timeSlots = [
    { time: '08:00 AM - 09:00 AM', status: 'taken' },
    { time: '09:00 AM - 10:00 AM', status: 'taken' },
    { time: '10:00 AM - 11:00 AM', status: 'available' },
    { time: '11:00 AM - 12:00 PM', status: 'available' },
    { time: '12:00 PM - 01:00 PM', status: 'available' },
    { time: '01:00 PM - 02:00 PM', status: 'available' },
  ];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  const firstDay = getFirstDayOfMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className={styles.container}>
      <div className={styles.mainGrid}>
        <div className={styles.leftColumn}>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              SELECT YOUR SPORT
            </h2>

            <div className={styles.sportGrid}>
              {sports.map((sport) => (
                <div
                  key={sport.id}
                  className={`${styles.sportCard} ${
                    selectedSport?.id === sport.id
                      ? styles.activeSport
                      : ''
                  }`}
                  onClick={() => setSelectedSport(sport)}
                >
                  <img
                    src={sport.image_url}
                    alt={sport.name}
                  />

                  <div className={styles.sportOverlay}>
                    <span>
                      {sport.icon} {sport.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className={styles.row}>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Select Date
                </h2>

                <div className={styles.calendarNav}>
                  <span>
                    {monthNames[currentMonth.getMonth()]}{' '}
                    {currentMonth.getFullYear()}
                  </span>

                  <div className={styles.navBtns}>
                    <ChevronLeft
                      size={16}
                      onClick={() =>
                        setCurrentMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() - 1,
                            1
                          )
                        )
                      }
                    />

                    <ChevronRight
                      size={16}
                      onClick={() =>
                        setCurrentMonth(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth() + 1,
                            1
                          )
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div className={styles.calendarGrid}>
                {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map(
                  (day) => (
                    <div key={day} className={styles.dayName}>
                      {day}
                    </div>
                  )
                )}

                {[...Array(firstDay)].map((_, i) => (
                  <div key={i}></div>
                ))}

                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;

                  return (
                    <div
                      key={day}
                      className={styles.day}
                      onClick={() =>
                        setSelectedDate(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth(),
                            day
                          )
                        )
                      }
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Location
              </h2>

              <div className={styles.locationList}>
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className={`${styles.locationItem} ${
                      selectedLocation?.id === location.id
                        ? styles.activeLocation
                        : ''
                    }`}
                    onClick={() => setSelectedLocation(location)}
                  >
                    <div className={styles.radio}>
                      {selectedLocation?.id === location.id ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Circle size={16} />
                      )}
                    </div>

                    <span>{location.name}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              AVAILABLE SLOTS
            </h2>

            <div className={styles.slotGrid}>
              {timeSlots.map((slot, i) => (
                <div
                  key={i}
                  className={`${styles.slot} ${styles[slot.status]}`}
                  onClick={() =>
                    slot.status !== 'taken' &&
                    setSelectedSlot(slot.time)
                  }
                >
                  {slot.time}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sessionCard}>
            <h3>YOUR SESSION</h3>

            <div className={styles.infoGroup}>
              <label>SPORT</label>
              <p>{selectedSport?.name}</p>
            </div>

            <div className={styles.infoGroup}>
              <label>LOCATION</label>
              <p>{selectedLocation?.name}</p>
            </div>

            <div className={styles.infoGroup}>
              <label>DATE</label>
              <p>{selectedDate.toDateString()}</p>
            </div>

            <div className={styles.infoGroup}>
              <label>SLOT</label>
              <p>{selectedSlot}</p>
            </div>

            <button
              onClick={handleCheckout}
              className={styles.checkoutBtn}
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
