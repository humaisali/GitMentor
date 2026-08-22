import crypto from 'crypto';

const PREFIX = 'enc:v1';

const getKey = () => {
  const secret = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
    || process.env.JWT_SECRET
    || (process.env.NODE_ENV === 'production' ? '' : 'gitmentor-dev-secret-key');
  if (!secret) {
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY or JWT_SECRET must be configured.');
  }
  return crypto.createHash('sha256').update(secret).digest();
};

export const encryptToken = (value) => {
  if (!value) return '';
  if (value.startsWith(`${PREFIX}:`)) return value;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [PREFIX, iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join(':');
};

export const decryptToken = (value) => {
  if (!value) return '';
  if (!value.startsWith(`${PREFIX}:`)) return value;

  const [, , ivValue, tagValue, encryptedValue] = value.split(':');
  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error('Stored Google credential is malformed.');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(ivValue, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
};
