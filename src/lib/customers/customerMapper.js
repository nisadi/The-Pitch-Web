const INACTIVE_AFTER_DAYS = 60;

/** All admin-placed bookings are stored under this fixed user ID. */
export const ADMIN_BOOKING_USER_ID = "dd12bb16-7b06-4483-adbc-57509529c1f4";

export const CUSTOMER_SELECT = `
  id,
  full_name,
  email,
  phone,
  created_at,
  role,
  bookings (
    id,
    booking_date,
    booking_status,
    payment_status,
    total_amount,
    locations ( short_name, name ),
    payments ( amount, payment_status )
  )
`;

/** Columns fetched for guest-style bookings (admin-created). */
export const GUEST_BOOKING_SELECT = `
  id,
  booking_date,
  booking_status,
  payment_status,
  total_amount,
  guest_name,
  guest_email,
  guest_phone,
  locations ( short_name, name ),
  payments ( amount, payment_status )
`;

function customerIdFromUuid(id) {
  if (!id) return "";
  return `CUS-${String(id).replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

function locationLabel(location) {
  if (!location) return "";
  const short = location.short_name?.trim();
  if (short) return short;

  const name = location.name?.trim() ?? "";
  return name.replace(/^The Pitch\s*-\s*/i, "").trim() || name;
}

function splitDateKey(isoOrDate) {
  if (!isoOrDate) return "";
  const text = String(isoOrDate);
  return text.includes("T") ? text.slice(0, 10) : text.slice(0, 10);
}

function deriveStatus(lastVisit, joinedDate, bookingsCount) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - INACTIVE_AFTER_DAYS);
  const cutoffKey = cutoff.toISOString().slice(0, 10);

  if (lastVisit && lastVisit >= cutoffKey) return "active";
  if (bookingsCount === 0 && joinedDate && joinedDate >= cutoffKey) {
    return "active";
  }

  return "inactive";
}

function aggregateBookings(bookings) {
  const list = Array.isArray(bookings) ? bookings : [];
  const locations = new Set();
  let bookingsCount = 0;
  let totalSpent = 0;
  let lastVisit = "";
  let lastVisitLocation = "";

  for (const booking of list) {
    if (booking.booking_status === "cancelled") continue;

    bookingsCount += 1;

    const dateKey = splitDateKey(booking.booking_date);
    const venueName = locationLabel(booking.locations);
    if (venueName) locations.add(venueName);

    if (dateKey && dateKey >= lastVisit) {
      lastVisit = dateKey;
      lastVisitLocation = venueName || lastVisitLocation;
    }

    const payments = Array.isArray(booking.payments) ? booking.payments : [];
    const paidFromPayments = payments
      .filter((p) => p.payment_status === "paid")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    if (paidFromPayments > 0) {
      totalSpent += paidFromPayments;
    } else if (booking.payment_status === "paid") {
      totalSpent += Number(booking.total_amount) || 0;
    }
  }

  const locationList = [...locations];

  return {
    bookingsCount,
    totalSpent,
    lastVisit,
    location:
      lastVisitLocation ||
      locationList.sort((a, b) => a.localeCompare(b))[0] ||
      "",
    locations: locationList,
  };
}

export function customerFromRow(row) {
  if (!row?.id) return null;

  const joinedDate = splitDateKey(row.created_at);
  const stats = aggregateBookings(row.bookings);

  return {
    id: customerIdFromUuid(row.id),
    dbId: row.id,
    name: row.full_name?.trim() || "Unknown",
    phone: row.phone?.trim() || "",
    email: row.email?.trim() || "",
    location: stats.location,
    locations: stats.locations,
    bookingsCount: stats.bookingsCount,
    totalSpent: stats.totalSpent,
    lastVisit: stats.lastVisit,
    status: deriveStatus(stats.lastVisit, joinedDate, stats.bookingsCount),
    joinedDate,
    isGuestCustomer: false,
  };
}

/**
 * Build virtual customer records from admin-created bookings.
 * Each unique (guest_name, guest_email, guest_phone) triplet becomes one entry.
 */
export function guestCustomersFromBookings(bookings) {
  /** Map key → { keyFields, bookings[] } */
  const groups = new Map();

  for (const booking of bookings ?? []) {
    const name = booking.guest_name?.trim() || "";
    const email = booking.guest_email?.trim() || "";
    const phone = booking.guest_phone?.trim() || "";
    if (!name) continue; // skip blocked slots with no guest info

    const key = `${name.toLowerCase()}|${email.toLowerCase()}|${phone}`;
    if (!groups.has(key)) {
      groups.set(key, { name, email, phone, bookings: [] });
    }
    groups.get(key).bookings.push(booking);
  }

  const customers = [];
  let idx = 0;
  for (const { name, email, phone, bookings: guestBookings } of groups.values()) {
    idx++;
    const stats = aggregateBookings(guestBookings);
    const firstBookingDate = guestBookings
      .map((b) => splitDateKey(b.booking_date))
      .filter(Boolean)
      .sort()
      .at(0) || "";

    customers.push({
      id: `GCU-${name.replace(/\s+/g, "").slice(0, 4).toUpperCase()}-${phone.replace(/\D/g, "").slice(-4) || "0000"}-${idx}`,
      dbId: null,
      name,
      phone,
      email,
      location: stats.location,
      locations: stats.locations,
      bookingsCount: stats.bookingsCount,
      totalSpent: stats.totalSpent,
      lastVisit: stats.lastVisit,
      status: deriveStatus(stats.lastVisit, firstBookingDate, stats.bookingsCount),
      joinedDate: firstBookingDate,
      isGuestCustomer: true,
    });
  }

  return customers;
}
