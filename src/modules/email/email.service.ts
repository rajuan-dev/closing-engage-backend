import { Resend } from 'resend';

import { env } from '../../config/env';
import { logger } from '../../core/logger';

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface EmailPayload {
  to: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
  subject: string;
  html: string;
  text: string;
}

export interface EmailDeliveryResult {
  delivered: boolean;
  providerId?: string;
}

export const sendEmail = async ({ to, bcc, replyTo, subject, html, text }: EmailPayload): Promise<EmailDeliveryResult> => {
  if (!resendClient || !env.RESEND_FROM_EMAIL) {
    logger.warn(
      {
        to,
        bcc,
        replyTo,
        subject,
        resendConfigured: Boolean(resendClient && env.RESEND_FROM_EMAIL),
      },
      'Email delivery skipped because Resend is not configured',
    );
    return { delivered: false };
  }

  const { data, error } = await resendClient.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    ...(bcc ? { bcc } : {}),
    ...(replyTo ? { replyTo } : {}),
    subject,
    html,
    text,
  });

  if (error) {
    logger.error({ err: error, to, replyTo, subject }, 'Email delivery failed');
    throw new Error(error.message);
  }

  logger.info({ to, bcc, replyTo, subject, providerId: data?.id }, 'Email delivered successfully');
  return { delivered: true, providerId: data?.id };
};

interface TemplatePayload {
  title: string;
  bodyHtml: string;
  actionUrl?: string;
  actionText?: string;
  warningHtml?: string;
  subject: string;
}

export const buildEmailTemplate = ({
  title,
  bodyHtml,
  actionUrl,
  actionText,
  warningHtml,
  subject,
}: TemplatePayload): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(24, 37, 63, 0.04);">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #18253f; padding: 32px 40px; border-bottom: 3px solid #2f69ff;">
              <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">Closing Engage</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 30px;">${title}</h2>
              <div style="font-size: 15px; color: #475569; line-height: 24px; margin-bottom: 24px;">
                ${bodyHtml}
              </div>
              
              ${actionUrl && actionText ? `
              <!-- CTA Button -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px;" bgcolor="#2f69ff">
                    <a href="${actionUrl}" target="_blank" style="font-size: 15px; font-family: sans-serif; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 14px 28px; border: 1px solid #2f69ff; display: inline-block; font-weight: 600;">
                      ${actionText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Warning / Secondary Info -->
              ${warningHtml ? `
              <div style="margin-top: 32px; padding: 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; color: #b45309; font-weight: 600; line-height: 20px;">
                  ${warningHtml}
                </p>
              </div>
              ` : ''}
            </td>
          </tr>
          <!-- Footer Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 0;">
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px 40px 40px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                This is an automated security notification from Closing Engage.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                &copy; ${new Date().getFullYear()} Closing Engage. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const sendResetOtpEmail = async (toEmail: string, displayName: string, otp: string): Promise<void> => {
  const html = buildEmailTemplate({
    title: 'Password Reset Requested',
    bodyHtml: `
      <p style="margin: 0;">Hello <strong>${displayName}</strong>,</p>
      <p style="margin: 16px 0 0 0;">You recently requested to reset your password. Use the verification code below to proceed with the password reset:</p>
      <div style="margin: 24px 0; padding: 16px; background-color: #f1f5f9; border-radius: 8px; text-align: center;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 0.15em; color: #0f172a; font-family: monospace;">${otp}</span>
      </div>
      <p style="margin: 0;">This code is valid for <strong>15 minutes</strong>. If you did not make this request, please ignore this email or contact support.</p>
    `,
    subject: 'Verification Code to Reset Password',
  });

  await sendEmail({
    to: toEmail,
    subject: 'Verification Code to Reset Password',
    html,
    text: [
      `Hello ${displayName},`,
      'Your 6-digit OTP verification code is:',
      otp,
      'This code will expire in 15 minutes.',
    ].join('\n'),
  });
};
