import { StatusCodes } from 'http-status-codes';

import { HttpError } from '../../core/http-error';
import {
  INotaryUser,
  NotaryCredentialStatus,
  NotaryCredentialVerification,
  NotaryScreeningStatus,
  NotaryUser,
} from '../user/notary-user.model';

type CommissionUpdate = Partial<{
  licenseNumber: string;
  commissionAuthority: string;
  commissionExpiry: string;
  eoCoverage: string;
  backgroundScreeningStatus: NotaryScreeningStatus;
  backgroundScreeningDetail: string;
}>;

type CredentialInput = {
  documentName: string;
  issuer: string;
  verification?: NotaryCredentialVerification;
};

const todayLabel = (): string =>
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const serializeCredentials = (notary: INotaryUser) => ({
  licenseNumber: notary.license ?? '',
  commissionAuthority: notary.commissionAuthority ?? '',
  commissionExpiry: notary.expiry ?? '',
  eoCoverage: notary.eoCoverage ?? '',
  verified: notary.verify ?? false,
  backgroundScreeningStatus: notary.backgroundScreeningStatus ?? 'Pending',
  backgroundScreeningDetail: notary.backgroundScreeningDetail ?? '',
  credentials: (notary.credentials ?? []).map((credential) => ({
    id: credential._id.toString(),
    documentName: credential.documentName,
    issuer: credential.issuer,
    uploadDate: credential.uploadDate,
    verification: credential.verification,
    status: credential.status ?? 'Pending',
  })),
});

const findActiveNotary = async (id: string): Promise<INotaryUser> => {
  const notary = await NotaryUser.findById(id);
  if (!notary || notary.status !== 'Active') {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Notary account not found');
  }
  return notary;
};

export const getNotaryCredentials = async (id: string) => {
  const notary = await findActiveNotary(id);
  return serializeCredentials(notary);
};

export const updateNotaryCommission = async (id: string, updates: CommissionUpdate) => {
  const notary = await findActiveNotary(id);

  if (updates.licenseNumber !== undefined) notary.license = updates.licenseNumber;
  if (updates.commissionAuthority !== undefined) notary.commissionAuthority = updates.commissionAuthority;
  if (updates.commissionExpiry !== undefined) notary.expiry = updates.commissionExpiry;
  if (updates.eoCoverage !== undefined) notary.eoCoverage = updates.eoCoverage;
  if (updates.backgroundScreeningStatus !== undefined) {
    notary.backgroundScreeningStatus = updates.backgroundScreeningStatus;
  }
  if (updates.backgroundScreeningDetail !== undefined) {
    notary.backgroundScreeningDetail = updates.backgroundScreeningDetail;
  }

  await notary.save();
  return serializeCredentials(notary);
};

export const addNotaryCredential = async (id: string, input: CredentialInput) => {
  const notary = await findActiveNotary(id);

  if (!notary.credentials) notary.credentials = [] as unknown as INotaryUser['credentials'];

  notary.credentials!.unshift({
    documentName: input.documentName,
    issuer: input.issuer,
    uploadDate: todayLabel(),
    verification: input.verification ?? 'Manual Review',
    status: 'Pending',
  });

  await notary.save();
  return serializeCredentials(notary);
};

/* ── Admin-facing (notary may be Active or Inactive) ── */

export const getNotaryCredentialsByAdmin = async (notaryId: string) => {
  const notary = await NotaryUser.findById(notaryId);
  if (!notary) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Notary user not found');
  }
  return serializeCredentials(notary);
};

export const reviewNotaryCredential = async (
  notaryId: string,
  credentialId: string,
  status: Extract<NotaryCredentialStatus, 'Approved' | 'Rejected'>,
) => {
  const notary = await NotaryUser.findById(notaryId);
  if (!notary) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Notary user not found');
  }

  const credential = notary.credentials?.id(credentialId);
  if (!credential) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Credential not found');
  }

  credential.status = status;
  credential.reviewedAt = new Date();
  await notary.save();

  return serializeCredentials(notary);
};
