import { sendBookingConfirmationEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const { email, fullName, booking } = await request.json();

    if (!email || !fullName || !booking) {
      return Response.json(
        { error: 'MISSING_DATA', message: 'email, fullName, and booking are required.' },
        { status: 400 }
      );
    }

    const result = await sendBookingConfirmationEmail(email, fullName, booking);

    if (result.success) {
      return Response.json({ success: true, messageId: result.messageId });
    } else {
      return Response.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (err) {
    console.error('[api/send-booking-email] Error:', err);
    return Response.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
