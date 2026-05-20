import { supabase } from '@/lib/supabase';

export const submitContactMessage = async (name, email, subject, message) => {
  const { data, error } = await supabase
    .from('contacts')
    .insert([
      { name, email, subject, message }
    ]);

  if (error) {
    console.error('Error submitting contact message:', error);
    return { success: false, error };
  }

  return { success: true, data };
};
