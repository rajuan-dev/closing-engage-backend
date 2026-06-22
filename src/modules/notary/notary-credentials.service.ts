import { StatusCodes } from 'http-status-codes';

import { HttpError } from '../../core/http-error';
import {
  INotaryUser,
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
  });

  await notary.save();
  return serializeCredentials(notary);
};
