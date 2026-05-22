/**
 * Link a claimed promo to a booking (booking_promos junction table).
 */
export async function attachPromoToBooking(supabase, bookingId, promoId) {
  if (!bookingId || !promoId) return { error: null };

  const { error } = await supabase.from("booking_promos").insert({
    booking_id: bookingId,
    promo_id: promoId,
  });

  return { error };
}
