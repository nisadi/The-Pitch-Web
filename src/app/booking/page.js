'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { getPitches } from '@/services/pitches';
import { filterPitchesForBooking } from '@/lib/pitches/pitchMapper';
import {
  isPastDate,
  isSelectableSlot,
} from '@/lib/booking/bookingSlots';
import {
  buildSlotsWithAvailability,
  subscribeToAvailability,
} from '@/lib/booking/bookingAvailability';

function pitchId(pitch) {
  return pitch?.dbId ?? pitch?.id ?? null;
}

export default function BookingPage() {
  const router = useRouter();
  const [sports, setSports] = useState([]);
  const [locations, setLocations] = useState([]);
  const [allPitches, setAllPitches] = useState([]);

  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedPitch, setSelectedPitch] = useState(null);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const locationPitches = useMemo(() => {
    if (!selectedLocation || !selectedSport) return [];
    return filterPitchesForBooking(
      allPitches,
      selectedLocation,
      selectedSport.id,
      selectedSport
    );
  }, [allPitches, selectedLocation, selectedSport]);

  const showPitchPicker = locationPitches.length >= 2;
  const activePitchId = pitchId(selectedPitch);

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
    const [sportsData, locationsData, pitchesData] = await Promise.all([
      getSports(),
      getLocations(),
      getPitches(),
    ]);

    setSports(sportsData);
    setLocations(locationsData);
    setAllPitches(pitchesData);

    if (sportsData.length > 0) {
      setSelectedSport(sportsData[0]);
    }

    if (locationsData.length > 0) {
      setSelectedLocation(locationsData[0]);
    }
  };

  useEffect(() => {
    if (!locationPitches.length) {
      setSelectedPitch(null);
      return;
    }
    const stillValid = locationPitches.some(
      (p) => pitchId(p) === pitchId(selectedPitch)
    );
    if (!stillValid) {
      setSelectedPitch(locationPitches[0]);
    }
  }, [locationPitches, selectedPitch]);

  const handleCheckout = () => {
    if (
      !selectedSport ||
      !selectedLocation ||
      !selectedDate ||
      !selectedSlot ||
      !activePitchId
    ) {
      alert('Please select all details');
      return;
    }
    if (isPastDate(selectedDate)) {
      alert('Please choose a date from today onwards.');
      return;
    }
    const slot = timeSlots.find((s) => s.time === selectedSlot);
    if (!slot || !isSelectableSlot(slot, selectedDate)) {
      alert('Please choose a future time slot.');
      return;
    }
    const bookingDetails = {
      sport: selectedSport,
      location: selectedLocation,
      pitch: selectedPitch,
      date: selectedDate.toDateString(),
      slot: selectedSlot,
      originalDate: selectedDate,
    };
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));
    router.push('/checkout');
  };

  const dateKey = useMemo(() => {
    const d = selectedDate;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [selectedDate]);

  const loadAvailability = useCallback(async () => {
    if (!selectedLocation?.id || !activePitchId) {
      setTimeSlots([]);
      return;
    }
    const slots = await buildSlotsWithAvailability(
      selectedLocation,
      selectedDate,
      selectedLocation.id,
      activePitchId
    );
    setTimeSlots(slots);
  }, [selectedLocation, selectedDate, activePitchId]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    if (!selectedLocation?.id || !dateKey || !activePitchId) return undefined;
    return subscribeToAvailability(
      selectedLocation.id,
      dateKey,
      loadAvailability,
      activePitchId
    );
  }, [selectedLocation?.id, dateKey, activePitchId, loadAvailability]);

  useEffect(() => {
    if (isPastDate(selectedDate)) {
      setSelectedDate(new Date());
    }
  }, [selectedDate]);

  useEffect(() => {
    const selectable = timeSlots.filter((s) =>
      isSelectableSlot(s, selectedDate)
    );
    if (selectable.length === 0) {
      setSelectedSlot(null);
      return;
    }
    const stillValid = selectable.some((s) => s.time === selectedSlot);
    if (!stillValid) {
      setSelectedSlot(selectable[0].time);
    }
  }, [timeSlots, selectedSlot, selectedDate]);

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
            <h2 className={styles.sectionTitle}>Location</h2>

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

            {showPitchPicker && (
              <div className={styles.pitchBlock}>
                <h3 className={styles.pitchSubtitle}>Select court</h3>
                <div className={styles.pitchList}>
                  {locationPitches.map((pitch) => (
                    <div
                      key={pitchId(pitch)}
                      className={`${styles.pitchItem} ${
                        pitchId(pitch) === activePitchId
                          ? styles.activePitch
                          : ''
                      }`}
                      onClick={() => setSelectedPitch(pitch)}
                    >
                      <div className={styles.radio}>
                        {pitchId(pitch) === activePitchId ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <Circle size={16} />
                        )}
                      </div>
                      <span>{pitch.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>SELECT YOUR SPORT</h2>

            <div className={styles.sportGrid}>
              {sports.map((sport) => (
                <div
                  key={sport.id}
                  className={`${styles.sportCard} ${
                    selectedSport?.id === sport.id ? styles.activeSport : ''
                  }`}
                  onClick={() => setSelectedSport(sport)}
                >
                  <img src={sport.image_url} alt={sport.name} />

                  <div className={styles.sportOverlay}>
                    <span>
                      {sport.icon} {sport.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`${styles.section} ${styles.calendarSection}`}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Select Date</h2>

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
              {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((day) => (
                <div key={day} className={styles.dayName}>
                  {day}
                </div>
              ))}

              {[...Array(firstDay)].map((_, i) => (
                <div key={`pad-${i}`}></div>
              ))}

              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const cellDate = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  day
                );
                const isPast = isPastDate(cellDate);
                const isSelected =
                  !isPast &&
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === currentMonth.getMonth() &&
                  selectedDate.getFullYear() === currentMonth.getFullYear();

                return (
                  <div
                    key={day}
                    className={`${styles.day} ${
                      isPast ? styles.dimmedDay : ''
                    } ${isSelected ? styles.selectedDay : ''}`}
                    onClick={() => {
                      if (!isPast) setSelectedDate(cellDate);
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>AVAILABLE SLOTS</h2>

            <div className={styles.slotGrid}>
              {!activePitchId && (
                <p className={styles.slotEmpty}>
                  No courts available for this sport at the selected location.
                </p>
              )}
              {activePitchId && timeSlots.length === 0 && (
                <p className={styles.slotEmpty}>
                  No slots available for this location. Set operational hours in
                  Admin → Settings → Locations.
                </p>
              )}
              {timeSlots.map((slot, i) => {
                const selectable = isSelectableSlot(slot, selectedDate);
                return (
                  <div
                    key={i}
                    className={`${styles.slot} ${
                      !selectable
                        ? styles.taken
                        : selectedSlot === slot.time
                          ? styles.selected
                          : styles.available
                    }`}
                    onClick={() => {
                      if (selectable) setSelectedSlot(slot.time);
                    }}
                  >
                    {slot.time}
                  </div>
                );
              })}
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

            {selectedPitch && (
              <div className={styles.infoGroup}>
                <label>COURT</label>
                <p>{selectedPitch.name}</p>
              </div>
            )}

            <div className={styles.infoGroup}>
              <label>DATE</label>
              <p>{selectedDate.toDateString()}</p>
            </div>

            <div className={styles.infoGroup}>
              <label>SLOT</label>
              <p>{selectedSlot ?? '—'}</p>
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
