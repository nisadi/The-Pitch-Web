const INACTIVE_AFTER_DAYS = 60;

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
  };
}
