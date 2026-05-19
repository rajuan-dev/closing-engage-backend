import { StatusCodes } from 'http-status-codes';

import { HttpError } from '../../core/http-error';
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
  const summary = request.role === 'company'
    ? `
      <p><strong>Company:</strong> ${request.companyName ?? 'N/A'}</p>
      <p><strong>Contact Type:</strong> ${request.contactType ?? 'N/A'}</p>
      <p><strong>Request Type:</strong> ${request.requestType ?? 'N/A'}</p>
    `
    : `
      <p><strong>Commission Number:</strong> ${request.commissionNumber ?? 'N/A'}</p>
      <p><strong>Commission Expiration:</strong> ${request.commissionExpiration ?? 'N/A'}</p>
      <p><strong>E&O Insurance:</strong> ${request.eoInsurance ?? 'N/A'}</p>
      <p><strong>Certifications:</strong> ${request.certifications ?? 'N/A'}</p>
    `;

  return {
    subject: `${title} from ${request.fullName}`,
    html: `
      <h2>${title}</h2>
      <p>A new access request was submitted through the Closing Engage website.</p>
      <p><strong>Name:</strong> ${request.fullName}</p>
      <p><strong>Email:</strong> ${request.email}</p>
      <p><strong>Phone:</strong> ${request.phone}</p>
      ${summary}
      <p><strong>Coverage Area:</strong> ${request.coverageArea}</p>
      <p><strong>Message:</strong> ${request.message ?? 'No additional comments.'}</p>
      <p><strong>Status:</strong> ${request.status}</p>
    `,
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
  const admins = await AdminUser.find({ isActive: true }).select('email');
  const recipients = admins.map((admin) => admin.email).filter(Boolean);

  if (recipients.length === 0) {
    return;
  }

  const email = buildAdminNotificationEmail(request);
  await sendEmail({ to: recipients, ...email });
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
