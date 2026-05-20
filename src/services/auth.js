import { supabase } from '@/lib/supabase';

export const signUp = async (email, password, fullName, phone) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone_number: phone,
      },
    },
  });

  if (error) {
    console.error('Error signing up:', error.message);
    return { user: null, error };
  }

  return { user: data.user, error: null };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error signing in:', error.message);
    return { user: null, error };
  }

  return { user: data.user, error: null };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    return { error };
  }
  return { error: null };
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    return { session: null, error };
  }
  return { session: data.session, error: null };
};

export const getUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error.message);
    return { user: null, error };
  }
  return { user: data.user, error: null };
};

export const updateProfile = async (updates) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  });
  if (error) {
    console.error('Error updating profile:', error.message);
    return { user: null, error };
  }
  return { user: data.user, error: null };
};
