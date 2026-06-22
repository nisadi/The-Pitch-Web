import { supabase } from '@/lib/supabase';

export const createEventInquiry = async ({
  organizationName,
  contactPerson,
  email,
  phone,
  location,
  eventCategory,
  guestCount,
  preferredDate,
  requirements
}) => {
  try {
    // 1. Try submitting via the admin API route first
    const response = await fetch('/api/events/inquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationName,
        contactPerson,
        email,
        phone,
        location,
        eventCategory,
        guestCount,
        preferredDate,
        requirements
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return { success: true, data: result.data };
    }

    // 2. If no service_role key is configured, fallback to standard client insert
    if (result.error === 'NO_SERVICE_ROLE_KEY') {
      const { data, error } = await supabase
        .from('event_inquiries')
        .insert([
          {
            organization_name: organizationName,
            contact_person: contactPerson,
            email,
            phone,
            location,
            event_category: eventCategory,
            guest_count: guestCount ? parseInt(guestCount, 10) : null,
            preferred_date: preferredDate || null,
            requirements
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error submitting event inquiry (fallback):', error);
        return { success: false, error };
      }

      return { success: true, data };
    }

    return { success: false, error: new Error(result.message || 'Submission failed') };
  } catch (err) {
    console.error('Admin inquiry submission error, falling back:', err);
    // Ultimate client-side fallback
    const { data, error } = await supabase
      .from('event_inquiries')
      .insert([
        {
          organization_name: organizationName,
          contact_person: contactPerson,
          email,
          phone,
          location,
          event_category: eventCategory,
          guest_count: guestCount ? parseInt(guestCount, 10) : null,
          preferred_date: preferredDate || null,
          requirements
        }
      ])
      .select()
      .single();

    if (error) {
      return { success: false, error };
    }
    return { success: true, data };
  }
};
