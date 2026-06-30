'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { filterSportsForLocation } from '@/lib/locations/locationSports';
import {
  isPastDate,
  isSelectableSlot,
  buildSlotsFromLocation,
} from '@/lib/booking/bookingSlots';
import { formatHourLabel } from '@/components/admin/bookingsUtils';
import {
  applyAvailabilityToSlots,
  fetchAvailabilityForDate,
  subscribeToAvailability,
} from '@/lib/booking/bookingAvailability';
import { resolveSessionPricing } from '@/lib/bookings/resolveSessionPricing';

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

  const [selectedSlots, setSelectedSlots] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const handleSlotClick = (clickedTime) => {
    setSelectedSlots((prev) => {
      if (prev.length === 0) return [clickedTime];

      const sortedPrev = [...prev].sort(
        (a, b) =>
          timeSlots.findIndex((s) => s.time === a) -
          timeSlots.findIndex((s) => s.time === b)
      );

      if (prev.includes(clickedTime)) {
        if (clickedTime === sortedPrev[0])
          return sortedPrev.slice(1);
        if (clickedTime === sortedPrev[sortedPrev.length - 1])
          return sortedPrev.slice(0, -1);
        return [clickedTime];
      }

      const firstIndex = timeSlots.findIndex((s) => s.time === sortedPrev[0]);
      const lastIndex = timeSlots.findIndex(
        (s) => s.time === sortedPrev[sortedPrev.length - 1]
      );
      const clickedIndex = timeSlots.findIndex((s) => s.time === clickedTime);

      if (clickedIndex === firstIndex - 1) return [clickedTime, ...sortedPrev];
      if (clickedIndex === lastIndex + 1) return [...sortedPrev, clickedTime];

      return [clickedTime];
    });
  };

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [currentMonth, setCurrentMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const availableSports = useMemo(
    () => filterSportsForLocation(sports, selectedLocation),
    [sports, selectedLocation]
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

  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const availabilityDebounceRef = useRef(null);
  const loadAvailabilityRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const [sessionResult, sportsData, locationsData, pitchesData] =
          await Promise.all([
            getSession(),
            getSports(),
            getLocations(),
            getPitches(),
          ]);

        if (cancelled) return;

        setSports(sportsData);
        setLocations(locationsData);
        setAllPitches(pitchesData);

        const initialLocation = locationsData[0] ?? null;
        if (initialLocation) {
          setSelectedLocation(initialLocation);
          const forLocation = filterSportsForLocation(
            sportsData,
            initialLocation
          );
          setSelectedSport(forLocation[0] ?? null);
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!selectedLocation || !sports.length) return;

    const forLocation = filterSportsForLocation(sports, selectedLocation);
    if (!forLocation.length) {
      setSelectedSport(null);
      return;
    }

    const stillValid = forLocation.some((sport) => sport.id === selectedSport?.id);
    if (!stillValid) {
      setSelectedSport(forLocation[0]);
    }
  }, [selectedLocation, sports, selectedSport?.id]);

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

  const handleCheckout = async () => {
    if (
      !selectedSport ||
      !selectedLocation ||
      !selectedDate ||
      selectedSlots.length === 0 ||
      !activePitchId
    ) {
      alert('Please select all details');
      return;
    }
    if (isPastDate(selectedDate)) {
      alert('Please choose a date from today onwards.');
      return;
    }

    const sortedSlots = [...selectedSlots].sort(
      (a, b) =>
        timeSlots.findIndex((s) => s.time === a) -
        timeSlots.findIndex((s) => s.time === b)
    );

    const firstSlot = timeSlots.find(s => s.time === sortedSlots[0]);
    const lastSlot = timeSlots.find(s => s.time === sortedSlots[sortedSlots.length - 1]);

    if (!firstSlot || !isSelectableSlot(firstSlot, selectedDate)) {
      alert('Please choose a valid future time slot.');
      return;
    }

    const startHour = firstSlot.startHour;
    const endHour = lastSlot.startHour + 1;

    const pricing = resolveSessionPricing({
      location: selectedLocation,
      pitch: selectedPitch,
      slot: sortedSlots[0],
      startHour,
      endHour,
    });

    const bookingDetails = {
      sport: { id: selectedSport.id, name: selectedSport.name },
      location: {
        id: selectedLocation.id,
        name: selectedLocation.name,
        openTimeMappings: selectedLocation.openTimeMappings,
        peakTimeMappings: selectedLocation.peakTimeMappings,
      },
      pitch: {
        id: selectedPitch.id,
        dbId: selectedPitch.dbId,
        name: selectedPitch.name,
        peak_hour_rate: selectedPitch.peakHourRate,
        non_peak_hour_rate: selectedPitch.nonPeakHourRate,
      },
      date: selectedDate.toDateString(),
      slot: `${firstSlot.time} - ${formatHourLabel(endHour)}`,
      startHour,
      endHour,
      subtotal: pricing.subtotal,
      rateLabel: pricing.rateLabel,
      // Build YYYY-MM-DD from LOCAL date components to avoid UTC timezone shift.
      // e.g. selectedDate.toISOString() for midnight June 20 in UTC+5:30 would
      // return "2026-06-19T18:30:00Z" and the date would be stored as June 19.
      originalDate: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
    };
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));

    // Log the selected booking details
    console.log("Pending booking details stored:", bookingDetails);

    const { session } = await getSession();
    if (!session) {
      router.push('/login?next=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const sessionPricing = useMemo(() => {
    if (!selectedLocation || !selectedPitch || selectedSlots.length === 0) return null;

    const sortedSlots = [...selectedSlots].sort(
      (a, b) =>
        timeSlots.findIndex((s) => s.time === a) -
        timeSlots.findIndex((s) => s.time === b)
    );
    const firstSlot = timeSlots.find(s => s.time === sortedSlots[0]);
    const lastSlot = timeSlots.find(s => s.time === sortedSlots[sortedSlots.length - 1]);

    if (!firstSlot || !lastSlot) return null;

    const d = selectedDate;
    const bDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return resolveSessionPricing({
      location: selectedLocation,
      pitch: selectedPitch,
      slot: sortedSlots[0],
      startHour: firstSlot.startHour,
      endHour: lastSlot.startHour + 1,
      bookingDate: bDate,
    });
  }, [selectedLocation, selectedPitch, selectedSlots, timeSlots, selectedDate]);


  const dateKey = useMemo(() => {
    const d = selectedDate;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [selectedDate]);

  const loadAvailability = useCallback(async () => {
    if (!selectedLocation) {
      setTimeSlots([]);
      return;
    }

    const base = buildSlotsFromLocation(selectedLocation, selectedDate);
    setTimeSlots(base);

    if (!selectedLocation.id || !activePitchId) return;

    const bookings = await fetchAvailabilityForDate(
      selectedLocation.id,
      dateKey,
      activePitchId
    );

    setTimeSlots(applyAvailabilityToSlots(base, bookings));
  }, [selectedLocation, selectedDate, activePitchId, dateKey]);

  loadAvailabilityRef.current = loadAvailability;

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    if (!selectedLocation?.id || !dateKey || !activePitchId) return undefined;

    const scheduleRefresh = () => {
      if (availabilityDebounceRef.current) {
        clearTimeout(availabilityDebounceRef.current);
      }
      availabilityDebounceRef.current = setTimeout(() => {
        void loadAvailabilityRef.current?.();
      }, 350);
    };

    return subscribeToAvailability(
      selectedLocation.id,
      dateKey,
      scheduleRefresh,
      activePitchId
    );
  }, [selectedLocation?.id, dateKey, activePitchId]);

  useEffect(() => {
    return () => {
      if (availabilityDebounceRef.current) {
        clearTimeout(availabilityDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPastDate(selectedDate)) {
      setSelectedDate(new Date());
    }
  }, [selectedDate]);

  useEffect(() => {
    const selectable = timeSlots.filter((s) =>
      isSelectableSlot(s, selectedDate)
    );
    setSelectedSlots(prev => {
      if (selectable.length === 0) return [];
      const validSlots = prev.filter(s => selectable.some(sel => sel.time === s));
      if (validSlots.length !== prev.length) {
        return validSlots.length > 0 ? [validSlots[0]] : [];
      }
      return prev;
    });
  }, [timeSlots, selectedDate]);

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

  if (isBootstrapping) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading booking options…</div>
      </div>
    );
  }

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
                  className={`${styles.locationItem} ${selectedLocation?.id === location.id
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

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>SELECT YOUR SPORT</h2>

            <div className={styles.sportGrid}>
              {availableSports.length === 0 && (
                <p className={styles.slotEmpty}>
                  No sports are configured for this location.
                </p>
              )}
              {availableSports.map((sport) => (
                <div
                  key={sport.id}
                  className={`${styles.sportCard} ${selectedSport?.id === sport.id ? styles.activeSport : ''
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

          {showPitchPicker && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Select court</h2>
              <div className={styles.pitchList}>
                {locationPitches.map((pitch) => (
                  <div
                    key={pitchId(pitch)}
                    className={`${styles.pitchItem} ${pitchId(pitch) === activePitchId
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
            </section>
          )}

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
                    className={`${styles.day} ${isPast ? styles.dimmedDay : ''
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
                    className={`${styles.slot} ${!selectable
                        ? styles.taken
                        : selectedSlots.includes(slot.time)
                          ? styles.selected
                          : styles.available
                      }`}
                    onClick={() => {
                      if (selectable) handleSlotClick(slot.time);
                    }}
                  >
                    {slot.time} - {formatHourLabel(slot.startHour + 1)}
                    {slot.isPeak && (
                      <span style={{
                        display: "block",
                        fontSize: "9px",
                        fontWeight: 800,
                        letterSpacing: "1px",
                        color: "#ff9500",
                        marginTop: "2px",
                        textTransform: "uppercase",
                      }}>
                        Peak
                      </span>
                    )}
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
              <label>LOCATION</label>
              <p>{selectedLocation?.name}</p>
            </div>

            <div className={styles.infoGroup}>
              <label>SPORT</label>
              <p>{selectedSport?.name}</p>
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
              {selectedSlots.length > 0
                ? (() => {
                    const sortedSlots = [...selectedSlots].sort(
                      (a, b) =>
                        timeSlots.findIndex((s) => s.time === a) -
                        timeSlots.findIndex((s) => s.time === b)
                    );
                    const slotObjects = sortedSlots
                      .map((t) => timeSlots.find((s) => s.time === t))
                      .filter(Boolean);

                    if (!slotObjects.length) return <p>—</p>;

                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                        {slotObjects.map((slot) => (
                          <div
                            key={slot.startHour}
                            style={{ display: "flex", alignItems: "center", gap: "6px" }}
                          >
                            <p style={{ margin: 0 }}>
                              {slot.time} – {formatHourLabel(slot.startHour + 1)}
                            </p>
                            {slot.isPeak && (
                              <span style={{
                                fontSize: "9px",
                                fontWeight: 800,
                                letterSpacing: "1px",
                                color: "#ff9500",
                                textTransform: "uppercase",
                                border: "1px solid rgba(255,149,0,0.4)",
                                borderRadius: "4px",
                                padding: "1px 5px",
                                lineHeight: 1.4,
                              }}>
                                Peak
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                : <p>—</p>}
            </div>

            {sessionPricing && sessionPricing.subtotal > 0 && (
              <div className={styles.infoGroup}>
                <label>SESSION FEE</label>
                <p>Rs. {sessionPricing.subtotal.toLocaleString('en-LK')}</p>
                <span className={styles.rateHint}>{sessionPricing.rateLabel}</span>
              </div>
            )}

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
