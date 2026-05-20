import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

import { env } from '../config/env';
import { logger } from '../core/logger';

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const sanitizePathPart = (value: string): string =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);

export const buildDocumentS3Key = (parts: {
  role: string;
  orderId?: string;
  fileName: string;
  ownerId?: string;
}): string => {
  const orderPart = sanitizePathPart(parts.orderId || 'unassigned-order');
  const ownerPart = sanitizePathPart(parts.ownerId || 'system');
  const filePart = sanitizePathPart(parts.fileName);
  return `documents/${parts.role}/${orderPart}/${ownerPart}/${Date.now()}-${filePart}`;
};

export const createPutSignedUrl = async (input: {
  key: string;
  contentType?: string;
  expiresInSeconds?: number;
}): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: input.key,
    ContentType: input.contentType || 'application/octet-stream',
  });

  return getSignedUrl(s3Client, command, { expiresIn: input.expiresInSeconds ?? 900 });
};

export const uploadBufferToS3 = async (input: {
  key: string;
  body: Buffer;
  contentType?: string;
}): Promise<void> => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType || 'application/octet-stream',
    }),
  );
};

export const createGetSignedUrl = async (input: {
  key: string;
  responseContentDisposition?: string;
  responseContentType?: string;
  expiresInSeconds?: number;
}): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: input.key,
    ResponseContentDisposition: input.responseContentDisposition,
    ResponseContentType: input.responseContentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: input.expiresInSeconds ?? 900 });
};

export const getObjectBufferFromS3 = async (input: {
  key: string;
}): Promise<{ body: Buffer; contentType?: string; contentLength?: number }> => {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: input.key,
    }),
  );

  if (!response.Body) {
    throw new Error('S3 object body is empty');
  }

  const streamBody = response.Body as Readable & {
    transformToByteArray?: () => Promise<Uint8Array>;
  };

  let body: Buffer;
  if (typeof streamBody.transformToByteArray === 'function') {
    body = Buffer.from(await streamBody.transformToByteArray());
  } else {
    const chunks: Buffer[] = [];
    for await (const chunk of streamBody) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    body = Buffer.concat(chunks);
  }

  return {
    body,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  };
};

export const deleteS3ObjectSafely = async (key?: string): Promise<boolean> => {
  if (!key) return true;

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
      }),
    );
    return true;
  } catch (error) {
    logger.error({ err: error, key }, 'S3 document delete failed after database delete');
    return false;
  }
};
