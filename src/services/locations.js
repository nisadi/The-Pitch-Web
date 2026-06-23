import { supabase } from '@/lib/supabase';
import { fetchOpenTimeMappingsBatch, fetchPeakTimeMappingsBatch } from '@/lib/locations/locationTimeMapper';

export const getLocations = async () => {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error(error);
    return [];
  }

  const locationIds = data.map(d => d.id);
  
  try {
    const [openTimeMappingsMap, peakTimeMappingsMap] = await Promise.all([
      fetchOpenTimeMappingsBatch(locationIds),
      fetchPeakTimeMappingsBatch(locationIds)
    ]);
  
    return data.map(loc => ({
      ...loc,
      openTimeMappings: openTimeMappingsMap[loc.id] || [],
      peakTimeMappings: peakTimeMappingsMap[loc.id] || []
    }));
  } catch (err) {
    console.error("Error fetching location time mappings:", err);
    return data;
  }
};