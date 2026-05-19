import { Resend } from 'resend';

import { env } from '../../config/env';
import { logger } from '../../core/logger';

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

export const sendEmail = async ({ to, subject, html, text }: EmailPayload): Promise<void> => {
  if (!resendClient || !env.RESEND_FROM_EMAIL) {
    logger.warn(
      {
        to,
        subject,
        resendConfigured: Boolean(resendClient && env.RESEND_FROM_EMAIL),
      },
      'Email delivery skipped because Resend is not configured',
    );
    return;
  }

  const { error } = await resendClient.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    logger.error({ err: error, to, subject }, 'Email delivery failed');
    throw new Error(error.message);
  }

  logger.info({ to, subject }, 'Email delivered successfully');
};
