export const PAYMENT_METHODS = ["card", "cash"];

export const PAYMENT_SELECT = `
  id,
  booking_id,
  payment_method,
  payment_method_other,
  transaction_id,
  amount,
  payment_status,
  paid_at,
  created_at,
  bookings (
    id,
    booking_date,
    start_time,
    end_time,
    booking_status,
    locations ( id, name, short_name ),
    sports ( id, name ),
    pitches ( id, name ),
    users ( id, full_name, email, phone )
  )
`;

const UI_STATUS_FROM_DB = {
  paid: "completed",
  pending: "pending",
  failed: "failed",
  refunded: "refunded",
};

const DB_STATUS_FROM_UI = {
  completed: "paid",
  pending: "pending",
  failed: "failed",
  refunded: "refunded",
};

function splitTimestamp(iso) {
  if (!iso) {
    return { date: "", time: "" };
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "", time: "" };
  }

  return {
    date: parsed.toISOString().slice(0, 10),
    time: parsed.toTimeString().slice(0, 5),
  };
}

function referenceFromUuid(id, prefix) {
  if (!id) return "";
  return `${prefix}-${String(id).replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

function displayIdFromPayment(row) {
  if (row.transaction_id?.trim()) {
    return row.transaction_id.trim();
  }

  const stamp = splitTimestamp(row.paid_at ?? row.created_at);
  const datePart = stamp.date.replace(/-/g, "");
  const suffix = String(row.id ?? "")
    .replace(/-/g, "")
    .slice(0, 3)
    .toUpperCase();

  return datePart ? `TXN-${datePart}-${suffix}` : `TXN-${suffix}`;
}

function formatTimeSlot(time) {
  if (!time) return "";
  const parts = String(time).split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] ?? 0);
  if (Number.isNaN(hours)) return String(time).slice(0, 5);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-LK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatBookingDate(dateKey) {
  if (!dateKey) return "";
  const parsed = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** e.g. "18 May 2026 · 9:00 AM – 10:00 AM" */
export function formatBookingSlotPeriod(booking) {
  if (!booking) return "";

  const dateLabel = formatBookingDate(booking.booking_date);
  const start = formatTimeSlot(booking.start_time);
  const end = formatTimeSlot(booking.end_time);

  if (dateLabel && start && end) {
    return `${dateLabel} · ${start} – ${end}`;
  }
  if (dateLabel && start) {
    return `${dateLabel} · ${start}`;
  }
  if (start && end) {
    return `${start} – ${end}`;
  }

  return dateLabel || "Booking slot";
}

function buildDescription(booking) {
  if (!booking) return "Payment";

  const sport = booking.sports?.name ?? "Booking";
  const pitch = booking.pitches?.name;
  const slot = formatBookingSlotPeriod(booking);

  if (pitch && slot) {
    return `${sport} – ${pitch} · ${slot}`;
  }
  if (slot) {
    return `${sport} · ${slot}`;
  }
  if (pitch) {
    return `${sport} – ${pitch}`;
  }

  return sport;
}

function locationLabel(location) {
  if (!location) return "";
  const short = location.short_name?.trim();
  if (short) return short;

  const name = location.name?.trim() ?? "";
  return name.replace(/^The Pitch\s*-\s*/i, "").trim() || name;
}

export function uiStatusFromDbStatus(dbStatus) {
  return UI_STATUS_FROM_DB[dbStatus] ?? dbStatus ?? "pending";
}

export function dbStatusFromUiStatus(uiStatus) {
  return DB_STATUS_FROM_UI[uiStatus] ?? uiStatus;
}

export function paymentFromRow(row) {
  if (!row?.id) return null;

  const booking = row.bookings ?? null;
  const user = booking?.users ?? null;
  const timestamp = row.paid_at ?? row.created_at;
  const { date, time } = splitTimestamp(timestamp);

  return {
    id: displayIdFromPayment(row),
    dbId: row.id,
    bookingDbId: row.booking_id ?? booking?.id ?? null,
    date,
    time,
    customerName: user?.full_name?.trim() || "Unknown customer",
    customerPhone: user?.phone?.trim() || "",
    customerEmail: user?.email?.trim() || "",
    location: locationLabel(booking?.locations),
    description: buildDescription(booking),
    method: row.payment_method === "cash" ? "cash" : "card",
    methodOther: row.payment_method_other?.trim() || null,
    status: uiStatusFromDbStatus(row.payment_status),
    amount: Number(row.amount) || 0,
    reference: booking?.id
      ? referenceFromUuid(booking.id, "BK")
      : referenceFromUuid(row.booking_id, "BK"),
    transactionId: row.transaction_id?.trim() || null,
    paidAt: row.paid_at ?? null,
    createdAt: row.created_at ?? null,
  };
}
