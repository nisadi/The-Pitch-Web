import { sendInviteEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const { name, email, password, loginUrl } = await request.json();

    if (!name || !email || !password) {
      return Response.json(
        { error: 'MISSING_DATA', message: 'name, email, and password are required.' },
        { status: 400 }
      );
    }

    const resolvedLoginUrl =
      loginUrl || `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'}/login`;

    const result = await sendInviteEmail(email, name, password, resolvedLoginUrl);

    if (result.success) {
      return Response.json({ success: true, messageId: result.messageId });
    } else {
      return Response.json(
        { error: 'EMAIL_SEND_FAILED', message: result.error },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('[api/send-invite-email] Error:', err);
    return Response.json(
      { error: 'SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
