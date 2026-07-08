import { Resend } from 'resend';

import { env } from '../../config/env';
import { logger } from '../../core/logger';

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface EmailPayload {
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text: string;
}

export interface EmailDeliveryResult {
  delivered: boolean;
  providerId?: string;
}

export const sendEmail = async ({ to, bcc, subject, html, text }: EmailPayload): Promise<EmailDeliveryResult> => {
  if (!resendClient || !env.RESEND_FROM_EMAIL) {
    logger.warn(
      {
        to,
        bcc,
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
    subject,
    html,
    text,
  });

  if (error) {
    logger.error({ err: error, to, subject }, 'Email delivery failed');
    throw new Error(error.message);
  }

  logger.info({ to, bcc, subject, providerId: data?.id }, 'Email delivered successfully');
  return { delivered: true, providerId: data?.id };
};

export const sendResetOtpEmail = async (toEmail: string, displayName: string, otp: string): Promise<void> => {
  await sendEmail({
    to: toEmail,
    subject: 'Verification Code to Reset Password',
    html: `
      <h2>Password Reset Requested</h2>
      <p>Hello ${displayName},</p>
      <p>Your 6-digit OTP verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 0.1em;">${otp}</p>
      <p>This code will expire in 15 minutes.</p>
    `,
    text: [
      `Hello ${displayName},`,
      'Your 6-digit OTP verification code is:',
      otp,
      'This code will expire in 15 minutes.',
    ].join('\n'),
  });
};
