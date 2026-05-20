import { supabase } from '@/lib/supabase';

// Generate a random reference code like MSG-123A56
const generateReferenceCode = () => {
  return 'MSG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Generate a random thread key
const generateThreadKey = () => {
  return 'thread_' + Math.random().toString(36).substring(2, 15);
};

export const submitContactMessage = async ({
  fullName,
  email,
  subject,
  message,
  phone = '',
  location = 'General',
}) => {
  const referenceCode = generateReferenceCode();
  const threadKey = generateThreadKey();

  const { data, error } = await supabase
    .from('contact_messages')
    .insert([
      {
        full_name: fullName,
        email,
        subject,
        message,
        phone,
        location,
        reference_code: referenceCode,
        status: 'new',
        thread_key: threadKey,
        replies: [],
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error submitting contact message:', error);
    return { success: false, error };
  }

  return { success: true, data };
};
