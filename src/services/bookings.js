import { supabase } from '@/lib/supabase';

export const createBooking = async ({
  user_id,
  sport_id,
  location_id,
  pitch_id,
  booking_date,
  start_time,
  end_time,
  total_amount,
}) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert([
      {
        user_id,
        sport_id,
        location_id,
        pitch_id,
        booking_date,
        start_time,
        end_time,
        total_amount,
        booking_status: 'confirmed',
        payment_status: 'paid',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
};