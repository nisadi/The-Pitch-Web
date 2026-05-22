import nodemailer from 'nodemailer';

// Configure the transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a welcome email to the user after their first successful login.
 * @param {string} toEmail
 * @param {string} fullName
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendWelcomeEmail = async (toEmail, fullName) => {
  try {
    const year = new Date().getFullYear();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to The Pitch</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F4F5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F4F5;padding:40px 20px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="800" cellpadding="0" cellspacing="0" border="0"
          style="max-width:800px;width:100%;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 25px 60px rgba(0,0,0,0.5);">

          <!-- RIGHT PANEL - Content -->
          <tr>
            <td style="background-color:#121212;padding:48px 40px;vertical-align:top;">

              <!-- Section label -->
              <div style="font-size:11px;font-weight:900;letter-spacing:3px;color:#A1A1AA;margin-bottom:12px;text-transform:uppercase;">
                WELCOME
              </div>

              <!-- Greeting -->
              <h2 style="margin:0 0 20px 0;font-size:22px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">
                Hey ${fullName},
              </h2>

              <!-- Body copy -->
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#A1A1AA;">
                Welcome to The Pitch! You have <span style="color:#A3FF00;font-weight:700;">successfully logged in</span> to the system.
              </p>
              <p style="margin:0 0 32px 0;font-size:15px;line-height:1.7;color:#A1A1AA;">
                Explore our facilities, manage bookings, and unlock premium field access.
              </p>

              <!-- Divider -->
              <div style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:24px;"></div>

              <!-- Support note -->
              <p style="margin:0;font-size:13px;line-height:1.7;color:rgba(161,161,170,0.7);">
                Have questions? Just contact support. See you on the pitch! ⚽
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0d0d0d;padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:rgba(161,161,170,0.5);">
                &copy; ${year} The Pitch. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->

</body>
</html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || '"The Pitch" <noreply@thepitch.com>',
      to: toEmail,
      subject: 'Welcome to The Pitch! ⚽',
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailer] Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Mailer] Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a booking confirmation email after a successful booking.
 * @param {string} toEmail
 * @param {string} fullName
 * @param {object} booking - { ref, sport, location, date, time, amount }
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendBookingConfirmationEmail = async (toEmail, fullName, booking) => {
  try {
    const year = new Date().getFullYear();
    const { ref, sport, location, date, time, amount } = booking;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmed - The Pitch</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F4F5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F4F5;padding:40px 20px;">
    <tr>
      <td align="center">

        <table width="800" cellpadding="0" cellspacing="0" border="0"
          style="max-width:800px;width:100%;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 25px 60px rgba(0,0,0,0.5);">

          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d1a0f 0%,#142218 50%,#0a1a0d 100%);padding:36px 40px 28px 40px;">
              <div style="font-size:11px;font-weight:900;letter-spacing:3px;color:#A3FF00;margin-bottom:16px;text-transform:uppercase;">THE PITCH</div>
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">BOOKING CONFIRMED ✓</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color:#121212;padding:40px;">

              <h2 style="margin:0 0 8px 0;font-size:20px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">
                Hey ${fullName},
              </h2>
              <p style="margin:0 0 28px 0;font-size:15px;line-height:1.7;color:#A1A1AA;">
                Your booking has been <span style="color:#A3FF00;font-weight:700;">confirmed</span>. Here are the details:
              </p>

              <!-- Booking Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 16px;background-color:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06);border-radius:8px 8px 0 0;">
                    <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#A1A1AA;text-transform:uppercase;margin-bottom:4px;">BOOKING REF</div>
                    <div style="font-size:16px;font-weight:800;color:#A3FF00;letter-spacing:1px;">${ref}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;background-color:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06);">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" style="vertical-align:top;">
                          <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#A1A1AA;text-transform:uppercase;margin-bottom:4px;">SPORT</div>
                          <div style="font-size:14px;font-weight:600;color:#ffffff;">${sport}</div>
                        </td>
                        <td width="50%" style="vertical-align:top;">
                          <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#A1A1AA;text-transform:uppercase;margin-bottom:4px;">LOCATION</div>
                          <div style="font-size:14px;font-weight:600;color:#ffffff;">${location}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;background-color:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06);">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" style="vertical-align:top;">
                          <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#A1A1AA;text-transform:uppercase;margin-bottom:4px;">DATE</div>
                          <div style="font-size:14px;font-weight:600;color:#ffffff;">${date}</div>
                        </td>
                        <td width="50%" style="vertical-align:top;">
                          <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#A1A1AA;text-transform:uppercase;margin-bottom:4px;">TIME SLOT</div>
                          <div style="font-size:14px;font-weight:600;color:#ffffff;">${time}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;background-color:rgba(255,255,255,0.03);border-radius:0 0 8px 8px;">
                    <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#A1A1AA;text-transform:uppercase;margin-bottom:4px;">TOTAL AMOUNT</div>
                    <div style="font-size:18px;font-weight:800;color:#ffffff;">Rs. ${typeof amount === 'number' ? amount.toFixed(2) : amount}</div>
                  </td>
                </tr>
              </table>

              <div style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:24px;"></div>

              <p style="margin:0;font-size:13px;line-height:1.7;color:rgba(161,161,170,0.7);">
                Have questions? Just contact support. See you on the pitch! ⚽
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0d0d0d;padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:rgba(161,161,170,0.5);">
                &copy; ${year} The Pitch. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || '"The Pitch" <noreply@thepitch.com>',
      to: toEmail,
      subject: `Booking Confirmed — ${ref}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailer] Booking confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Mailer] Error sending booking confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a payment confirmation email after a successful payment.
 * @param {string} toEmail
 * @param {string} fullName
 * @param {object} payment - { ref, amount, method, date, bookingRef }
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendPaymentConfirmationEmail = async (toEmail, fullName, payment) => {
  try {
    const year = new Date().getFullYear();
    const { ref, amount, method, date, bookingRef } = payment;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Confirmed - The Pitch</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F4F5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F4F5;padding:40px 20px;">
    <tr>
      <td align="center">

        <table width="800" cellpadding="0" cellspacing="0" border="0"
          style="max-width:800px;width:100%;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 25px 60px rgba(0,0,0,0.5);">

          <!-- Header Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d1a0f 0%,#142218 50%,#0a1a0d 100%);padding:36px 40px 28px 40px;">
              <div style="font-size:11px;font-weight:900;letter-spacing:3px;color:#A3FF00;margin-bottom:16px;text-transform:uppercase;">THE PITCH</div>
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">PAYMENT RECEIVED ✓</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color:#121212;padding:40px;">

              <h2 style="margin:0 0 8px 0;font-size:20px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">
                Hey ${fullName},
              </h2>
              <p style="margin:0 0 28px 0;font-size:15px;line-height:1.7;color:#A1A1AA;">
                Your payment has been <span style="color:#A3FF00;font-weight:700;">successfully processed</span>. Here's your receipt:
              </p>

              <!-- Payment Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 16px;background-color:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06);border-radius:8px 8px 0 0;">
                    <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#A1A1AA;text-transform:uppercase;margin-bottom:4px;">TRANSACTION REF</div>
                    <div style="font-size:16px;font-weight:800;color:#A3FF00;letter-spacing:1px;">${ref}</div>
                  </td>
                </tr>
                ${bookingRef ? `<tr>
                  <td style="padding:14px 16px;background-color:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06);">
                    <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#A1A1AA;text-transform:uppercase;margin-bottom:4px;">BOOKING REF</div>
                    <div style="font-size:14px;font-weight:600;color:#ffffff;">${bookingRef}</div>
                  </td>
                </tr>` : ''}
                <tr>
                  <td style="padding:14px 16px;background-color:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06);">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" style="vertical-align:top;">
                          <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#A1A1AA;text-transform:uppercase;margin-bottom:4px;">AMOUNT PAID</div>
                          <div style="font-size:18px;font-weight:800;color:#ffffff;">Rs. ${typeof amount === 'number' ? amount.toFixed(2) : amount}</div>
                        </td>
                        <td width="50%" style="vertical-align:top;">
                          <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#A1A1AA;text-transform:uppercase;margin-bottom:4px;">PAYMENT METHOD</div>
                          <div style="font-size:14px;font-weight:600;color:#ffffff;">${method || 'Credit/Debit Card'}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;background-color:rgba(255,255,255,0.03);border-radius:0 0 8px 8px;">
                    <div style="font-size:10px;font-weight:900;letter-spacing:2px;color:#A1A1AA;text-transform:uppercase;margin-bottom:4px;">PAYMENT DATE</div>
                    <div style="font-size:14px;font-weight:600;color:#ffffff;">${date || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </td>
                </tr>
              </table>

              <div style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:24px;"></div>

              <p style="margin:0;font-size:13px;line-height:1.7;color:rgba(161,161,170,0.7);">
                Have questions about your payment? Just contact support. See you on the pitch! ⚽
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0d0d0d;padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:rgba(161,161,170,0.5);">
                &copy; ${year} The Pitch. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || '"The Pitch" <noreply@thepitch.com>',
      to: toEmail,
      subject: `Payment Confirmed — ${ref}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailer] Payment confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Mailer] Error sending payment confirmation email:', error);
    return { success: false, error: error.message };
  }
};

