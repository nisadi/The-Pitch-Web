import { supabase } from '@/lib/supabase';

export const getSports = async () => {
  const { data, error } = await supabase
    .from('sports')
    .select('*')
    .eq('is_active', true)
    .order('created_at');

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};