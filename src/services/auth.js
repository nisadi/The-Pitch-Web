import { supabase } from '@/lib/supabase';
import { loginRoleUser } from '@/lib/auth/loginRoleUser';

export const signUp = async (email, password, fullName, phone) => {
  try {
    // Try signing up via the admin API first (bypasses email limits if service_role key is set)
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName, phone }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Auto login after admin signup since the email is pre-confirmed
      const loginRes = await signIn(email, password);
      return { user: result.user, session: loginRes.session, error: null, adminCreated: true };
    }

    // If the service_role key is not configured, fall back to standard client signup
    if (result.error === 'NO_SERVICE_ROLE_KEY') {
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

      return { user: data.user, error: null, adminCreated: false };
    }

    return { user: null, error: new Error(result.message || 'Signup failed') };
  } catch (err) {
    console.error('Admin signup error, falling back:', err);
    // Ultimate fallback to client-side signup
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
      return { user: null, error };
    }
    return { user: data.user, error: null, adminCreated: false };
  }
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
    if (error.message !== 'Auth session missing!') {
      console.error('Error getting user:', error.message);
    }
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

export const loginUser = async (email, password) => {
  // p-1 Try admin / role-based login (RPC)
  try {
    const adminUser = await loginRoleUser(email, password);
    // user is admin/manager/staff
    return { user: adminUser, isAdmin: true, roleId: adminUser.roleId, error: null };
  } catch {
    // Not an admin user
  }

  // p-2 standard Supabase customer signInWithPassword
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, isAdmin: false, roleId: null, error };
  }

  return { user: data.user, isAdmin: false, roleId: null, error: null };
};
