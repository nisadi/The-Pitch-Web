import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { dbTimesOverlap, hoursToDbRange } from "@/lib/bookings/bookingRange";
import { buildSlotsFromLocation } from "./bookingSlots";

const AVAILABILITY_SELECT =
  "id, booking_date, start_time, end_time, booking_status, location_id, sport_id, pitch_id";

export async function fetchAvailabilityForDate(locationDbId, dateKey) {
  if (!isSupabaseConfigured() || !locationDbId || !dateKey) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(AVAILABILITY_SELECT)
    .eq("location_id", locationDbId)
    .eq("booking_date", dateKey)
    .not("booking_status", "eq", "cancelled");

  if (error) {
    console.error("[fetchAvailabilityForDate]", error);
    return [];
  }

  return data ?? [];
}

function slotOverlapsBooking(slotStartHour, slotEndHour, booking) {
  const { start_time, end_time } = hoursToDbRange(slotStartHour, slotEndHour);
  return dbTimesOverlap(
    start_time,
    end_time,
    booking.start_time,
    booking.end_time
  );
}

/**
 * Mark slots taken or blocked based on rows in `bookings` for that day/location.
 */
export function applyAvailabilityToSlots(slots, bookings = []) {
  if (!bookings.length) return slots;

  return slots.map((slot) => {
    if (slot.status === "past") return slot;

    const hour = slot.startHour;
    const endHour = hour + 1;
    const hit = bookings.find((b) =>
      slotOverlapsBooking(hour, endHour, b)
    );

    if (!hit) return slot;

    return {
      ...slot,
      status: hit.booking_status === "blocked" ? "blocked" : "taken",
      bookingId: hit.id,
    };
  });
}

export async function buildSlotsWithAvailability(
  location,
  selectedDate,
  locationDbId
) {
  const base = buildSlotsFromLocation(location, selectedDate);
  if (!locationDbId) return base;

  const dateKey =
    selectedDate instanceof Date
      ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
      : selectedDate;

  const bookings = await fetchAvailabilityForDate(locationDbId, dateKey);
  return applyAvailabilityToSlots(base, bookings);
}

export function subscribeToAvailability(
  locationDbId,
  dateKey,
  onRefresh
) {
  if (!isSupabaseConfigured() || !locationDbId || !dateKey) return () => {};

  const supabase = createClient();
  const channelName = `booking-availability-${locationDbId}-${dateKey}-${Date.now()}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookings",
        filter: `location_id=eq.${locationDbId}`,
      },
      () => {
        void onRefresh();
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error(
          "Supabase realtime subscription failed for booking availability"
        );
      }
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
