import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  BOOKING_CALENDAR_SELECT,
  calendarBookingFromRow,
} from "./bookingMapper";

export async function fetchCalendarBookings({ locationDbId, fromDate, toDate }) {
  if (!isSupabaseConfigured() || !locationDbId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_CALENDAR_SELECT)
    .eq("location_id", locationDbId)
    .gte("booking_date", fromDate)
    .lte("booking_date", toDate)
    .order("booking_date")
    .order("start_time");

  if (error) {
    console.error("[fetchCalendarBookings]", error);
    return [];
  }

  return (data ?? []).map(calendarBookingFromRow).filter(Boolean);
}

export async function fetchBookingById(bookingId) {
  if (!isSupabaseConfigured() || !bookingId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_CALENDAR_SELECT)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    console.error("[fetchBookingById]", error);
    return null;
  }

  return calendarBookingFromRow(data);
}

function isInDateRange(bookingDate, fromDate, toDate) {
  if (!bookingDate) return false;
  if (fromDate && bookingDate < fromDate) return false;
  if (toDate && bookingDate > toDate) return false;
  return true;
}

export function applyBookingRealtimeEvent(
  bookings,
  payload,
  { locationDbId, fromDate, toDate }
) {
  const event = payload.eventType;
  const row = payload.new ?? payload.old;

  if (!row) return bookings;

  const rowLocationId = row.location_id;
  const rowDate = row.booking_date;

  if (event === "DELETE") {
    return bookings.filter((b) => b.id !== row.id);
  }

  if (rowLocationId !== locationDbId) {
    return bookings.filter((b) => b.id !== row.id);
  }

  if (!isInDateRange(rowDate, fromDate, toDate)) {
    return bookings.filter((b) => b.id !== row.id);
  }

  const mapped = calendarBookingFromRow(payload.new);
  if (!mapped) return bookings;

  if (mapped.bookingStatus === "cancelled") {
    return bookings.filter((b) => b.id !== mapped.id);
  }

  const without = bookings.filter((b) => b.id !== mapped.id);
  return [...without, mapped].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.startTime ?? "").localeCompare(b.startTime ?? "");
  });
}

/**
 * Realtime sync for admin calendar — merges inserts/updates/deletes into local state.
 */
export function subscribeToBookingsCalendar(
  { locationDbId, fromDate, toDate },
  onChange
) {
  if (!isSupabaseConfigured() || !locationDbId) return () => {};

  const supabase = createClient();
  const channelName = `bookings-calendar-${locationDbId}-${Date.now()}`;

  const handlePayload = async (payload) => {
    const event = payload.eventType;
    const rowId = payload.new?.id ?? payload.old?.id;

    if (event === "DELETE") {
      onChange((bookings) =>
        applyBookingRealtimeEvent(bookings, payload, {
          locationDbId,
          fromDate,
          toDate,
        })
      );
      return;
    }

    if (!rowId) return;

    const full = await fetchBookingById(rowId);
    if (!full || full.locationId !== locationDbId) return;
    if (!isInDateRange(full.date, fromDate, toDate)) return;

    if (full.bookingStatus === "cancelled") {
      onChange((bookings) => bookings.filter((b) => b.id !== full.id));
      return;
    }

    onChange((bookings) => {
      const without = bookings.filter((b) => b.id !== full.id);
      return [...without, full].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startTime ?? "").localeCompare(b.startTime ?? "");
      });
    });
  };

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings" },
      (payload) => {
        void handlePayload(payload);
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error(
          "Supabase realtime subscription failed for bookings table"
        );
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
