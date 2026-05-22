import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

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
 * Reads the logo and returns a base64 data URI so it renders
 * inline inside the email without showing as an attachment.
 */
const getLogoDataUri = () => {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'the-pitch-logo.png');
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch {
    return '';
  }
};

/**
 * Sends a welcome email to the user after successful account creation.
 * @param {string} toEmail
 * @param {string} fullName
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendWelcomeEmail = async (toEmail, fullName) => {
  try {
    const logoSrc = getLogoDataUri();
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`;
    const year = new Date().getFullYear();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to The Pitch</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0A;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0A0A0A;padding:40px 20px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 25px 60px rgba(0,0,0,0.5);">

          <!-- LEFT PANEL (top on mobile) - Branding -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d1a0f 0%,#142218 50%,#0a1a0d 100%);padding:48px 40px;vertical-align:top;">

              <!-- Logo -->
              ${logoSrc ? `<div style="margin-bottom:28px;">
                <img src="${logoSrc}" alt="The Pitch" style="height:48px;width:auto;display:block;" />
              </div>` : `<div style="margin-bottom:28px;font-size:0.85rem;font-weight:900;letter-spacing:3px;color:#A3FF00;">THE PITCH</div>`}

              <!-- Brand label -->
              <div style="font-size:11px;font-weight:900;letter-spacing:3px;color:#A3FF00;margin-bottom:20px;text-transform:uppercase;">
                THE PITCH
              </div>

              <!-- Headline -->
              <h1 style="margin:0 0 16px 0;font-size:32px;font-weight:900;color:#ffffff;line-height:1.1;text-transform:uppercase;letter-spacing:1px;">
                JOIN<br/>THE CLUB
              </h1>

              <!-- Subtext -->
              <p style="margin:0 0 28px 0;font-size:14px;line-height:1.8;color:rgba(255,255,255,0.65);">
                Your account has been created and you're ready to book your premium field access.
              </p>

              <!-- Feature badge -->
              <div style="display:inline-block;background:rgba(163,255,0,0.08);border:1px solid rgba(163,255,0,0.2);border-radius:10px;padding:12px 16px;font-size:13px;color:rgba(255,255,255,0.85);">
                ✔ &nbsp; Secure athlete account activated
              </div>

            </td>
          </tr>

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
                Your account has been <span style="color:#A3FF00;font-weight:700;">created successfully</span>. You're now part of The Pitch community.
              </p>
              <p style="margin:0 0 32px 0;font-size:15px;line-height:1.7;color:#A1A1AA;">
                Log in to explore our facilities, manage bookings, and unlock premium field access.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${loginUrl}"
                  style="display:inline-block;background-color:#A3FF00;color:#0A0A0A;padding:14px 36px;text-decoration:none;font-weight:800;border-radius:10px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">
                  LOG IN NOW &rarr;
                </a>
              </div>

              <!-- Divider -->
              <div style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:24px;"></div>

              <!-- Support note -->
              <p style="margin:0;font-size:13px;line-height:1.7;color:rgba(161,161,170,0.7);">
                Have questions? Reply to this email or contact our support team. See you on the pitch! ⚽
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
      subject: 'Your account is ready — Welcome to The Pitch! ⚽',
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
