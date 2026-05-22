import { sendWelcomeEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const { email, fullName } = await request.json();

    if (!email || !fullName) {
      return Response.json(
        { error: 'MISSING_DATA', message: 'Email and full name are required.' },
        { status: 400 }
      );
    }

    const result = await sendWelcomeEmail(email, fullName);

    if (result.success) {
      return Response.json({ success: true, messageId: result.messageId });
    } else {
      return Response.json(
        { error: 'EMAIL_SEND_FAILED', message: result.error },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('Error in send-welcome-email API route:', err);
    return Response.json(
      { error: 'SERVER_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
