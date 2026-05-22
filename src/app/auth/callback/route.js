import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/mailer';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/';

  const supabase = await createClient();

  // Flow 1: PKCE flow — Supabase sends a `code` parameter
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      await trySendWelcomeEmail(data.user);
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('[Auth Callback] Code exchange failed:', error?.message);
  }

  // Flow 2: Token hash flow — Supabase sends `token_hash` + `type`
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (!error && data?.user) {
      await trySendWelcomeEmail(data.user);
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('[Auth Callback] Token verification failed:', error?.message);
  }

  // If nothing worked, redirect to login with an error
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}

/**
 * Attempts to send the welcome email — never throws.
 */
async function trySendWelcomeEmail(user) {
  const fullName =
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'there';

  try {
    await sendWelcomeEmail(user.email, fullName);
    console.log('[Auth Callback] Welcome email sent to', user.email);
  } catch (err) {
    console.error('[Auth Callback] Failed to send welcome email:', err.message);
  }
}
