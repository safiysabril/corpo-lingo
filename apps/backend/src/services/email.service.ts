import { Resend } from 'resend';
import nodemailer from 'nodemailer';

/**
 * Email delivery strategy:
 *
 * 1. RESEND_API_KEY is set → Resend HTTP API (HTTPS port 443, works on Railway)
 *    Sign up at resend.com → free tier: 3 000 emails/month, 100/day.
 *
 * 2. Local dev with no config → Ethereal disposable inbox (nodemailer built-in).
 *    No sign-up needed. A preview URL is printed to the console.
 *
 * 3. Production with no config → skip and log a warning.
 */

async function sendViaResend(
  to: string,
  from: string,
  subject: string,
  text: string,
  html: string,
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from, to, subject, text, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

async function sendViaEthereal(
  to: string,
  from: string,
  subject: string,
  text: string,
  html: string,
): Promise<void> {
  const testAccount = await nodemailer.createTestAccount();
  console.log('\n[Email] No config — using Ethereal test account');
  console.log(`[Email] User: ${testAccount.user}  Pass: ${testAccount.pass}`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  const info = await transporter.sendMail({ from, to, subject, text, html });
  console.log(`[Email] Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`);
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
): Promise<void> {
  const from = process.env.EMAIL_FROM || 'Corpo Lingo <noreply@corpolingo.app>';
  const subject = 'Reset your Corpo Lingo password';

  const text = [
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
  ].join('\n');

  const html = `
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
  `;

  if (process.env.RESEND_API_KEY) {
    await sendViaResend(to, from, subject, text, html);
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    await sendViaEthereal(to, from, subject, text, html);
    return;
  }

  console.warn(`[Email] No email provider configured — skipping send to ${to}`);
  console.warn(`[Email] Reset URL: ${resetUrl}`);
}
