import { supabase } from '@/lib/supabase';

export const getGallery = async () => {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .eq('is_active', true)
    .order('created_at');

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};