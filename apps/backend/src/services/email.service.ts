import nodemailer from 'nodemailer';

/**
 * Email delivery strategy:
 *
 * 1. If SMTP_HOST + SMTP_USER + SMTP_PASS are set → send via that SMTP server.
 *    Works with any provider. Recommended free option: Resend
 *      SMTP_HOST=smtp.resend.com  SMTP_PORT=465  SMTP_USER=resend  SMTP_PASS=<api-key>
 *
 * 2. In development (NODE_ENV !== 'production') with no SMTP configured →
 *    auto-create an Ethereal test account. The email is NOT delivered; a preview
 *    URL is printed to the backend console.
 *
 * 3. In production with no SMTP configured → skip sending and log a warning.
 *    The reset URL is logged so it can still be used manually during testing.
 */

async function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  // Local dev fallback: Ethereal — disposable test inbox, zero config needed
  const testAccount = await nodemailer.createTestAccount();
  console.log('\n[Email] No SMTP configured — using Ethereal test account');
  console.log(`[Email] Inbox: https://ethereal.email/login`);
  console.log(`[Email] User: ${testAccount.user}  Pass: ${testAccount.pass}\n`);
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
): Promise<void> {
  const transporter = await createTransporter();

  if (!transporter) {
    console.warn(`[Email] SMTP not configured — skipping email to ${to}`);
    console.warn(`[Email] Reset URL: ${resetUrl}`);
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || '"Corpo Lingo" <noreply@corpo-lingo.dev>';

  const info = await transporter.sendMail({
    from: `"Corpo Lingo" <${from}>`,
    to,
    subject: 'Reset your Corpo Lingo password',
    text: [
      `Hi ${name},`,
      '',
      'You requested a password reset. Open the link below to set a new password.',
      'The link expires in 1 hour.',
      '',
      resetUrl,
      '',
      'If you did not request this, you can safely ignore this email.',
      '',
      '— Corpo Lingo',
    ].join('\n'),
    html: `
      <p>Hi ${name},</p>
      <p>You requested a password reset. Click the button below to choose a new password.
         The link expires in <strong>1 hour</strong>.</p>
      <p style="margin:24px 0">
        <a href="${resetUrl}"
           style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;
                  text-decoration:none;font-weight:600;display:inline-block">
          Reset Password
        </a>
      </p>
      <p style="font-size:12px;color:#666">
        Or paste this link into your browser:<br/>
        <a href="${resetUrl}">${resetUrl}</a>
      </p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>— Corpo Lingo</p>
    `,
  });

  // When using Ethereal, log a direct preview URL so you can inspect the email instantly
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`\n[Email] Preview URL: ${previewUrl}\n`);
  }
}
