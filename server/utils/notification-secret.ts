import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const NOTIFICATION_SECRET_ALGORITHM = 'aes-256-gcm';
const NOTIFICATION_SECRET_VERSION = 'v1';
const NOTIFICATION_SECRET_IV_LENGTH = 12;

export interface NotificationSecrets {
  smtpPassword: string;
}

function readEncryptionSecretKey() {
  const runtimeConfig = useRuntimeConfig();
  const normalizedKey = String(runtimeConfig.encryptionSecretKey || runtimeConfig.notificationSecretKey || '').trim();

  if (!normalizedKey) {
    throw new Error('缺少 ENCRYPTION_SECRET_KEY 环境变量');
  }

  return createHash('sha256').update(normalizedKey).digest();
}

export function encryptNotificationSecrets(input: NotificationSecrets) {
  const iv = randomBytes(NOTIFICATION_SECRET_IV_LENGTH);
  const cipher = createCipheriv(NOTIFICATION_SECRET_ALGORITHM, readEncryptionSecretKey(), iv);
  const plaintext = JSON.stringify(input);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    NOTIFICATION_SECRET_VERSION,
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptNotificationSecrets(ciphertext: string): NotificationSecrets {
  const [version, ivText, authTagText, encryptedText] = String(ciphertext || '').split('.');

  if (version !== NOTIFICATION_SECRET_VERSION || !ivText || !authTagText || !encryptedText) {
    throw new Error('通知密钥格式无效');
  }

  const decipher = createDecipheriv(
    NOTIFICATION_SECRET_ALGORITHM,
    readEncryptionSecretKey(),
    Buffer.from(ivText, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(authTagText, 'base64url'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64url')),
    decipher.final(),
  ]).toString('utf8');

  return JSON.parse(decrypted) as NotificationSecrets;
}
