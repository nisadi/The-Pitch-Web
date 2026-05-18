export const BOOKING_STATUSES = {
  confirmed: { label: "Confirmed", color: "var(--primary)" },
  pending: { label: "Pending", color: "#f59e0b" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
};

export const LOCATIONS = ["Maharagama", "Attidiya", "Moratuwa"];

export const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export const mockBookings = [
  {
    id: "b1",
    date: "2026-05-18",
    time: "08:00 AM - 09:00 AM",
    sport: "Football",
    location: "Maharagama",
    court: "Pitch 1",
    customer: "Jason David",
    status: "confirmed",
  },
  {
    id: "b2",
    date: "2026-05-18",
    time: "10:00 AM - 11:00 AM",
    sport: "Cricket",
    location: "Attidiya",
    court: "Net 2",
    customer: "Sarah Lee",
    status: "confirmed",
  },
  {
    id: "b3",
    date: "2026-05-18",
    time: "02:00 PM - 03:00 PM",
    sport: "Futsal",
    location: "Moratuwa",
    court: "Pitch 3",
    customer: "Michael Ryan",
    status: "pending",
  },
  {
    id: "b4",
    date: "2026-05-18",
    time: "05:00 PM - 06:00 PM",
    sport: "Football",
    location: "Maharagama",
    court: "Pitch 2",
    customer: "Ruwan Dias",
    status: "confirmed",
  },
  {
    id: "b10",
    date: "2026-05-19",
    time: "09:00 AM - 10:00 AM",
    sport: "Futsal",
    location: "Attidiya",
    court: "Pitch 1",
    customer: "Nisha Perera",
    status: "confirmed",
  },
  {
    id: "b11",
    date: "2026-05-19",
    time: "03:00 PM - 04:00 PM",
    sport: "Cricket",
    location: "Moratuwa",
    court: "Net 1",
    customer: "Tom Anderson",
    status: "pending",
  },
  {
    id: "b12",
    date: "2026-05-21",
    time: "11:00 AM - 12:00 PM",
    sport: "Football",
    location: "Maharagama",
    court: "Pitch 1",
    customer: "Lisa Chen",
    status: "confirmed",
  },
  {
    id: "b13",
    date: "2026-05-21",
    time: "06:00 PM - 07:00 PM",
    sport: "Cricksal",
    location: "Attidiya",
    court: "Pitch 2",
    customer: "Mark Wilson",
    status: "cancelled",
  },
  {
    id: "b14",
    date: "2026-05-20",
    time: "06:00 PM - 07:00 PM",
    sport: "Football",
    location: "Maharagama",
    court: "Pitch 2",
    customer: "Amila Perera",
    status: "confirmed",
  },
  {
    id: "b5",
    date: "2026-05-20",
    time: "07:00 PM - 08:00 PM",
    sport: "Football",
    location: "Maharagama",
    court: "Pitch 1",
    customer: "Nimal Fernando",
    status: "confirmed",
  },
  {
    id: "b6",
    date: "2026-05-22",
    time: "09:00 AM - 10:00 AM",
    sport: "Cricksal",
    location: "Attidiya",
    court: "Pitch 1",
    customer: "Priya Wickram",
    status: "pending",
  },
  {
    id: "b7",
    date: "2026-05-25",
    time: "11:00 AM - 12:00 PM",
    sport: "Football",
    location: "Moratuwa",
    court: "Pitch 1",
    customer: "David Silva",
    status: "cancelled",
  },
  {
    id: "b8",
    date: "2026-05-25",
    time: "04:00 PM - 05:00 PM",
    sport: "Futsal",
    location: "Maharagama",
    court: "Pitch 2",
    customer: "Anjali Rao",
    status: "confirmed",
  },
  {
    id: "b9",
    date: "2026-05-28",
    time: "05:00 PM - 06:00 PM",
    sport: "Cricket",
    location: "Maharagama",
    court: "Net 1",
    customer: "Kamal Jayasuriya",
    status: "confirmed",
  },
];

export function filterByLocation(bookings, location) {
  if (!location) return bookings;
  return bookings.filter((b) => b.location === location);
}

export function getBookingsForDate(bookings, dateKey) {
  return bookings.filter((b) => b.date === dateKey);
}

export function toDateKey(year, month, day) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}
