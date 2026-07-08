import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env';
import { HttpError } from '../../core/http-error';
import { logger } from '../../core/logger';
import { AdminUser } from '../auth/auth.model';
import { sendEmail } from '../email/email.service';
import { AccessRequest, IAccessRequest } from './access-request.model';

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

const serializeAccessRequest = (request: IAccessRequest) => ({
  id: request._id.toString(),
  role: request.role,
  fullName: request.fullName,
  email: request.email,
  phone: request.phone,
  companyName: request.companyName,
  contactType: request.contactType,
  requestType: request.requestType,
  commissionNumber: request.commissionNumber,
  commissionExpiration: request.commissionExpiration,
  eoInsurance: request.eoInsurance,
  certifications: request.certifications,
  coverageArea: request.coverageArea,
  message: request.message,
  status: request.status,
  createdDate: formatDate(request.createdAt),
});

const buildAdminNotificationEmail = (request: ReturnType<typeof serializeAccessRequest>) => {
  const title = request.role === 'company' ? 'New Title Company Access Request' : 'New Notary Access Request';
  const dashboardUrl = `${env.WEBSITE_BASE_URL}/dashboard/requests`;

  const summaryHtml = request.role === 'company'
    ? `
      <!-- Col 1 -->
      <td width="48%" style="vertical-align: top; padding-right: 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding-bottom: 20px;">
              <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Company Name</div>
              <div style="font-size: 15px; color: #0f172a; font-weight: 700;">${request.companyName ?? 'N/A'}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Request Type</div>
              <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${request.requestType ?? 'N/A'}</div>
            </td>
          </tr>
        </table>
      </td>
      <!-- Spacer -->
      <td width="4%">&nbsp;</td>
      <!-- Col 2 -->
      <td width="48%" style="vertical-align: top; padding-left: 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding-bottom: 20px;">
              <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Contact Type</div>
              <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${request.contactType ?? 'N/A'}</div>
            </td>
          </tr>
        </table>
      </td>
    `
    : `
      <!-- Col 1 -->
      <td width="48%" style="vertical-align: top; padding-right: 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding-bottom: 20px;">
              <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Commission Number</div>
              <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${request.commissionNumber ?? 'N/A'}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">E&O Insurance</div>
              <div style="font-size: 15px; color: #16a34a; font-weight: 700;">${request.eoInsurance ?? 'N/A'}</div>
            </td>
          </tr>
        </table>
      </td>
      <!-- Spacer -->
      <td width="4%">&nbsp;</td>
      <!-- Col 2 -->
      <td width="48%" style="vertical-align: top; padding-left: 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding-bottom: 20px;">
              <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Commission Expiration</div>
              <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${request.commissionExpiration ?? 'N/A'}</div>
            </td>
          </tr>
          <tr>
            <td>
              <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Certifications</div>
              <div style="font-size: 14px; color: #0f172a; font-weight: 600; line-height: 1.4;">${request.certifications ?? 'N/A'}</div>
            </td>
          </tr>
        </table>
      </td>
    `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 48px 0;">
        <tr>
          <td align="center" style="padding: 0 16px;">
            <!-- Main Email Card -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0; overflow: hidden; border-collapse: separate;">
              
              <!-- Decorative Top Accent Bar -->
              <tr>
                <td height="6" style="background: linear-gradient(90deg, #2563eb 0%, #38bdf8 100%); line-height: 6px; font-size: 1px;">&nbsp;</td>
              </tr>

              <!-- Header Section -->
              <tr>
                <td style="background-color: #0f172a; padding: 40px 48px; text-align: left;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="vertical-align: middle;">
                        <span style="color: #38bdf8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 8px;">Closing Engage Portal</span>
                        <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; line-height: 1.25; letter-spacing: -0.5px;">${title}</h1>
                      </td>
                      <td style="text-align: right; vertical-align: middle;" width="115">
                        <span style="display: inline-block; background-color: rgba(254, 243, 199, 0.12); border: 1px solid rgba(217, 119, 6, 0.3); color: #fbbf24; padding: 8px 16px; font-size: 11px; font-weight: 700; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
                          ${request.status}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Content Body Section -->
              <tr>
                <td style="padding: 48px; color: #334155; line-height: 1.6;">
                  <p style="margin: 0 0 36px 0; font-size: 16px; color: #475569;">A new access request has been submitted through the public website. Review the applicant's details below to verify and manage portal activation.</p>
                  
                  <!-- Section: Contact Details -->
                  <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #64748b; margin: 0 0 16px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; letter-spacing: 1.5px;">Contact Profile</h2>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 36px;">
                    <tr>
                      <!-- Col 1 -->
                      <td width="48%" style="vertical-align: top; padding-right: 12px;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="padding-bottom: 20px;">
                              <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Applicant Name</div>
                              <div style="font-size: 15px; color: #0f172a; font-weight: 700;">${request.fullName}</div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Phone Number</div>
                              <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${request.phone ?? 'N/A'}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                      
                      <!-- Spacer -->
                      <td width="4%">&nbsp;</td>

                      <!-- Col 2 -->
                      <td width="48%" style="vertical-align: top; padding-left: 12px;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="padding-bottom: 20px;">
                              <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Email Address</div>
                              <div style="font-size: 15px; font-weight: 600;"><a href="mailto:${request.email}" style="color: #2563eb; text-decoration: none; border-bottom: 1px dotted #2563eb;">${request.email}</a></div>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <div style="font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Coverage Area</div>
                              <div style="font-size: 15px; color: #0f172a; font-weight: 600;">${request.coverageArea}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Section: Professional Credentials -->
                  <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #64748b; margin: 0 0 16px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; letter-spacing: 1.5px;">Professional Credentials</h2>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 36px;">
                    <tr>
                      ${summaryHtml}
                    </tr>
                  </table>

                  <!-- Section: Message / Comments -->
                  <h2 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #64748b; margin: 0 0 12px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; letter-spacing: 1.5px;">Applicant Message</h2>
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #cbd5e1; padding: 20px; border-radius: 8px; margin-bottom: 40px; font-size: 14.5px; color: #475569; font-style: italic; line-height: 1.5;">
                    "${request.message || 'No additional comments.'}"
                  </div>

                  <!-- Actions Section -->
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center" style="padding-top: 10px;">
                        <a href="${dashboardUrl}" target="_blank" style="display: block; background-color: #2563eb; color: #ffffff; padding: 16px 36px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 10px; text-align: center; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1); width: 220px; margin: 0 auto; letter-spacing: 0.2px;">Create Account</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer Branding Section -->
              <tr>
                <td style="background-color: #f8fafc; padding: 32px 48px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                  <p style="margin: 0 0 6px 0;">This notification email was sent automatically from your backend service.</p>
                  <p style="margin: 0;">&copy; ${new Date().getFullYear()} Closing Engage. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return {
    subject: `${title} from ${request.fullName}`,
    html,
    text: [
      title,
      `Name: ${request.fullName}`,
      `Email: ${request.email}`,
      `Phone: ${request.phone}`,
      request.companyName ? `Company: ${request.companyName}` : null,
      request.contactType ? `Contact Type: ${request.contactType}` : null,
      request.requestType ? `Request Type: ${request.requestType}` : null,
      request.commissionNumber ? `Commission Number: ${request.commissionNumber}` : null,
      request.commissionExpiration ? `Commission Expiration: ${request.commissionExpiration}` : null,
      request.eoInsurance ? `E&O Insurance: ${request.eoInsurance}` : null,
      request.certifications ? `Certifications: ${request.certifications}` : null,
      `Coverage Area: ${request.coverageArea}`,
      `Message: ${request.message ?? 'No additional comments.'}`,
      `Status: ${request.status}`,
    ]
      .filter(Boolean)
      .join('\n'),
  };
};

const notifyAdminsForAccessRequest = async (request: ReturnType<typeof serializeAccessRequest>): Promise<void> => {
  const configuredRecipients = env.ACCESS_REQUEST_NOTIFICATION_EMAILS;
  let recipients = configuredRecipients;

  if (recipients.length === 0) {
    const admins = await AdminUser.find({ isActive: true }).select('email');
    recipients = admins.map((admin) => admin.email).filter(Boolean);
  }

  if (recipients.length === 0) {
    logger.warn(
      {
        accessRequestId: request.id,
        role: request.role,
        applicantEmail: request.email,
      },
      'Access request notification skipped because no recipients are configured',
    );
    return;
  }

  const email = buildAdminNotificationEmail(request);
  try {
    await sendEmail({ to: recipients, ...email });
  } catch (error) {
    logger.error(
      {
        err: error,
        accessRequestId: request.id,
        role: request.role,
        applicantEmail: request.email,
        recipients,
      },
      'Access request persisted, but admin notification email failed',
    );
  }
};

interface AccessRequestPayload {
  role: 'company' | 'notary';
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  contactType?: string;
  requestType?: string;
  commissionNumber?: string;
  commissionExpiration?: string;
  eoInsurance?: string;
  certifications?: string;
  coverageArea: string;
  message?: string;
}

export const createAccessRequest = async (payload: AccessRequestPayload) => {
  const accessRequest = await AccessRequest.create({
    ...payload,
    email: payload.email.trim().toLowerCase(),
    status: 'Pending',
  });

  const serialized = serializeAccessRequest(accessRequest);
  await notifyAdminsForAccessRequest(serialized);

  return serialized;
};

export const listAccessRequests = async () => {
  const requests = await AccessRequest.find().sort({ createdAt: -1 });
  return requests.map(serializeAccessRequest);
};

export const updateAccessRequestStatus = async (
  id: string,
  status: 'Pending' | 'Approved' | 'Declined',
) => {
  const request = await AccessRequest.findByIdAndUpdate(id, { status }, { new: true });

  if (!request) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Access request not found');
  }

  return serializeAccessRequest(request);
};
