import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env';
import { HttpError } from '../../core/http-error';
import { logger } from '../../core/logger';
import { AdminUser, IAdminUser } from './auth.model';

const LEGACY_SEED_ADMIN_EMAIL = 'admin@closingengage.com';
const DEFAULT_ADMIN_PROFILE = {
  fullName: 'Closing Engage Admin',
  phone: '+1 (555) 010-1000',
  companyName: 'Closing Engage',
  contactNumber: '+1 (555) 010-1000',
  businessAddress: 'Austin, Texas',
} as const;

interface AdminJwtPayload {
  sub: string;
  email: string;
  role: 'admin';
}

interface AdminProfileInput {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  companyEmail: string;
  contactNumber: string;
  businessAddress: string;
}

const sanitizeAdmin = (admin: IAdminUser) => ({
  id: admin._id.toString(),
  email: admin.email,
  role: admin.role,
  profile: {
    fullName: admin.fullName,
    email: admin.email,
    phone: admin.phone,
    companyName: admin.companyName,
    companyEmail: admin.companyEmail,
    contactNumber: admin.contactNumber,
    businessAddress: admin.businessAddress,
  },
});

const createAdminToken = (admin: IAdminUser): string =>
  jwt.sign(
    {
      sub: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );

export const ensureSeedAdmin = async (): Promise<void> => {
  const seedEmail = env.ADMIN_SEED_EMAIL.trim().toLowerCase();
  const existingAdmin = await AdminUser.findOne({ email: seedEmail });

  if (existingAdmin) {
    const missingProfileFields = [
      existingAdmin.fullName,
      existingAdmin.phone,
      existingAdmin.companyName,
      existingAdmin.companyEmail,
      existingAdmin.contactNumber,
      existingAdmin.businessAddress,
    ].some((value) => !value?.trim());

    if (missingProfileFields) {
      existingAdmin.fullName = existingAdmin.fullName?.trim() || DEFAULT_ADMIN_PROFILE.fullName;
      existingAdmin.phone = existingAdmin.phone?.trim() || DEFAULT_ADMIN_PROFILE.phone;
      existingAdmin.companyName = existingAdmin.companyName?.trim() || DEFAULT_ADMIN_PROFILE.companyName;
      existingAdmin.companyEmail = existingAdmin.companyEmail?.trim() || seedEmail;
      existingAdmin.contactNumber = existingAdmin.contactNumber?.trim() || DEFAULT_ADMIN_PROFILE.contactNumber;
      existingAdmin.businessAddress = existingAdmin.businessAddress?.trim() || DEFAULT_ADMIN_PROFILE.businessAddress;
      await existingAdmin.save();
      logger.info({ email: seedEmail }, 'Default admin profile fields backfilled');
    }

    if (seedEmail !== LEGACY_SEED_ADMIN_EMAIL) {
      const legacySeedAdmin = await AdminUser.findOne({ email: LEGACY_SEED_ADMIN_EMAIL });
      if (legacySeedAdmin?.isActive) {
        legacySeedAdmin.isActive = false;
        await legacySeedAdmin.save();

        logger.info(
          {
            email: LEGACY_SEED_ADMIN_EMAIL,
            replacementEmail: seedEmail,
            adminId: legacySeedAdmin._id.toString(),
            action: 'legacy-seed-deactivated',
          },
          'Legacy seed admin deactivated',
        );
      }
    }

    logger.info(
      {
        email: existingAdmin.email,
        adminId: existingAdmin._id.toString(),
        seeded: true,
        action: missingProfileFields ? 'backfilled-and-skipped' : 'already-exists-skipped',
      },
      'Admin seed check completed',
    );

    return;
  }

  const legacySeedAdmin = await AdminUser.findOne({ email: LEGACY_SEED_ADMIN_EMAIL });

  if (legacySeedAdmin) {
    legacySeedAdmin.email = seedEmail;
    legacySeedAdmin.companyEmail = seedEmail;
    legacySeedAdmin.fullName = legacySeedAdmin.fullName?.trim() || DEFAULT_ADMIN_PROFILE.fullName;
    legacySeedAdmin.phone = legacySeedAdmin.phone?.trim() || DEFAULT_ADMIN_PROFILE.phone;
    legacySeedAdmin.companyName = legacySeedAdmin.companyName?.trim() || DEFAULT_ADMIN_PROFILE.companyName;
    legacySeedAdmin.contactNumber = legacySeedAdmin.contactNumber?.trim() || DEFAULT_ADMIN_PROFILE.contactNumber;
    legacySeedAdmin.businessAddress = legacySeedAdmin.businessAddress?.trim() || DEFAULT_ADMIN_PROFILE.businessAddress;
    await legacySeedAdmin.save();

    logger.info(
      {
        email: seedEmail,
        previousEmail: LEGACY_SEED_ADMIN_EMAIL,
        adminId: legacySeedAdmin._id.toString(),
        seeded: true,
        action: 'legacy-seed-email-updated',
      },
      'Admin seed check completed',
    );

    return;
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_SEED_PASSWORD, 12);

  await AdminUser.create({
    email: seedEmail,
    passwordHash,
    role: 'admin',
    isActive: true,
    ...DEFAULT_ADMIN_PROFILE,
    companyEmail: seedEmail,
  });

  logger.info(
    {
      email: seedEmail,
      seeded: true,
      action: 'created',
    },
    'Admin seed check completed',
  );
};

export const loginAdmin = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const admin = await AdminUser.findOne({ email: normalizedEmail });

  if (!admin || !admin.isActive) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  return {
    token: createAdminToken(admin),
    admin: sanitizeAdmin(admin),
  };
};

export const verifyAdminToken = (token: string): AdminJwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AdminJwtPayload;
  } catch {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
  }
};

export const getAdminById = async (id: string) => {
  const admin = await AdminUser.findById(id);

  if (!admin || !admin.isActive) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Admin account not found');
  }

  return sanitizeAdmin(admin);
};

export const updateAdminProfile = async (id: string, updates: AdminProfileInput) => {
  const admin = await AdminUser.findById(id);

  if (!admin || !admin.isActive) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Admin account not found');
  }

  admin.fullName = updates.fullName;
  admin.email = updates.email.trim().toLowerCase();
  admin.phone = updates.phone;
  admin.companyName = updates.companyName;
  admin.companyEmail = updates.companyEmail.trim().toLowerCase();
  admin.contactNumber = updates.contactNumber;
  admin.businessAddress = updates.businessAddress;

  await admin.save();

  return sanitizeAdmin(admin);
};

export const updateAdminPassword = async (id: string, currentPassword: string, newPassword: string): Promise<void> => {
  const admin = await AdminUser.findById(id);

  if (!admin || !admin.isActive) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Admin account not found');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Current password is incorrect');
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  await admin.save();
};
