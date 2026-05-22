import { sendPaymentConfirmationEmail } from '@/lib/mailer';

export async function POST(request) {
  try {
    const { email, fullName, payment } = await request.json();

    if (!email || !fullName || !payment) {
      return Response.json(
        { error: 'MISSING_DATA', message: 'email, fullName, and payment are required.' },
        { status: 400 }
      );
    }

    const result = await sendPaymentConfirmationEmail(email, fullName, payment);

    if (result.success) {
      return Response.json({ success: true, messageId: result.messageId });
    } else {
      return Response.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (err) {
    console.error('[api/send-payment-email] Error:', err);
    return Response.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
