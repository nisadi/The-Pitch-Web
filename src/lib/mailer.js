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
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 25px 60px rgba(0,0,0,0.5);">

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
