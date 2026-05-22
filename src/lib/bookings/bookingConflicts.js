import { dbTimesOverlap } from "./bookingRange";

/**
 * Returns first booking row that overlaps [start_time, end_time) on the same day/location.
 */
export async function findBookingRangeConflict(
  supabase,
  { location_id, booking_date, start_time, end_time, excludeId }
) {
  let query = supabase
    .from("bookings")
    .select("id, start_time, end_time, booking_status")
    .eq("location_id", location_id)
    .eq("booking_date", booking_date)
    .not("booking_status", "eq", "cancelled");

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).find((row) =>
    dbTimesOverlap(row.start_time, row.end_time, start_time, end_time)
  );
}
