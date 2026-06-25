import { parseTimeField } from "@/components/admin/bookingsUtils";
import { hoursToDbRange as rangeToDb } from "./bookingRange";

export const BOOKING_CALENDAR_SELECT = `
  id,
  booking_date,
  start_time,
  end_time,
  booking_status,
  payment_status,
  total_amount,
  guest_name,
  guest_email,
  guest_phone,
  sport_id,
  location_id,
  pitch_id,
  remark,
  discount_type,
  discount_value,
  final_amount,
  locations ( id, slug, name, short_name ),
  sports ( id, name ),
  pitches ( id, name ),
  users ( id, full_name, email, phone ),
  payments ( id, payment_method, transaction_id, paid_at )
`;

export function formatBookingReference(id) {
  if (!id) return "";
  const suffix = String(id).replace(/-/g, "").slice(0, 6).toUpperCase();
  return `BK-${suffix}`;
}

function formatTime12(timeStr) {
  if (!timeStr) return "";
  const { hour, minute } = parseTimeField(timeStr);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("en-LK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatSlotLabelFromDb(startTime, endTime) {
  const start = formatTime12(startTime);
  const end = formatTime12(endTime);
  if (start && end) return `${start} - ${end}`;
  return start || end || "";
}

function locationFilterLabel(location) {
  if (!location) return "";
  const short = location.short_name?.trim();
  if (short) return short;
  const name = location.name?.trim() ?? "";
  return name.replace(/^The Pitch\s*-\s*/i, "").trim() || name;
}

const UI_STATUS_FROM_DB = {
  blocked: "blocked",
  confirmed: "confirmed",
  completed: "confirmed",
  pending: "pending",
  cancelled: "cancelled",
};

export function calendarStatusFromDb(dbStatus) {
  return UI_STATUS_FROM_DB[dbStatus] ?? "pending";
}

export function calendarBookingFromRow(row) {
  if (!row?.id) return null;

  const startHour = parseTimeField(row.start_time).hour;

  // payments is an array (one-to-many); take the most recent paid one
  const paymentRow = Array.isArray(row.payments)
    ? (row.payments.find((p) => p.payment_method) ?? row.payments[0] ?? null)
    : null;

  return {
    id: row.id,
    date: row.booking_date,
    time: formatSlotLabelFromDb(row.start_time, row.end_time),
    startHour,
    startTime: row.start_time,
    endTime: row.end_time,
    sport: row.sports?.name ?? "Booking",
    sportId: row.sport_id,
    location: locationFilterLabel(row.locations),
    locationId: row.location_id,
    court: row.pitches?.name ?? "—",
    pitchId: row.pitch_id,
    customer:
      row.booking_status === "blocked"
        ? "Blocked (backoffice)"
        : row.guest_name?.trim() || row.users?.full_name?.trim() || "",
    customerEmail: row.guest_email?.trim() || row.users?.email?.trim() || "",
    customerPhone: row.guest_phone?.trim() || row.users?.phone?.trim() || "",
    userId: row.user_id ?? row.users?.id ?? null,
    totalAmount: Number(row.total_amount) || 0,
    reference: formatBookingReference(row.id),
    status: calendarStatusFromDb(row.booking_status),
    bookingStatus: row.booking_status,
    paymentStatus: row.payment_status,
    paymentMethod: paymentRow?.payment_method ?? null,
    transactionId: paymentRow?.transaction_id ?? null,
    paidAt: paymentRow?.paid_at ?? null,
    remark: row.remark ?? null,
    discountType: row.discount_type ?? null,
    discountValue: Number(row.discount_value) || 0,
    finalAmount: Number(row.final_amount) || Number(row.total_amount) || 0,
  };
}

export function hoursToDbRange(startHour, endHour) {
  return rangeToDb(startHour, endHour);
}

/** Single-hour slot (start → start + 1). */
export function hourToDbRange(hour) {
  return hoursToDbRange(hour, Number(hour) + 1);
}
