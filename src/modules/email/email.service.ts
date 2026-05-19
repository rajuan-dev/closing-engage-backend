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
