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
      const siteUrl = window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phone,
          },
          emailRedirectTo: `${siteUrl}/auth/callback`,
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
    const siteUrl = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phone,
        },
        emailRedirectTo: `${siteUrl}/auth/callback`,
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

  // Send welcome email on first login (after email confirmation)
  const user = data.user;
  if (user) {
    const createdAt = new Date(user.created_at).getTime();
    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : null;

    // First login: last_sign_in_at is null, or within 2 minutes of created_at
    const isFirstLogin = !lastSignIn || Math.abs(lastSignIn - createdAt) < 120000;

    if (isFirstLogin) {
      const fullName = user.user_metadata?.full_name || email.split('@')[0];
      try {
        fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, fullName }),
        });
      } catch (err) {
        console.error('Failed to send welcome email:', err);
      }
    }
  }

  return { user: data.user, isAdmin: false, roleId: null, error: null };
};
