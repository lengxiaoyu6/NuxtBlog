import type { AdminSessionUser } from '../../shared/types/auth';
import {
  createAdminUser,
  findAdminUserByUsername,
  updateAdminUserPassword,
} from '../repositories/admin-user.repository';

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const MINIMUM_PASSWORD_LENGTH = 8;

function buildAdminDisplayName(username: string) {
  return username === 'admin' ? '站点管理员' : username;
}

function toAdminSessionUser(adminUser: {
  id: number;
  username: string;
  displayName: string;
  mustChangePassword: boolean;
}) {
  const sessionUser: AdminSessionUser = {
    id: adminUser.id,
    username: adminUser.username,
    displayName: adminUser.displayName,
    mustChangePassword: adminUser.mustChangePassword,
  };

  return sessionUser;
}

export async function ensureSeedAdminUser() {
  const existingUser = await findAdminUserByUsername(DEFAULT_ADMIN_USERNAME);

  if (existingUser) {
    return existingUser.id;
  }

  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  const createdUser = await createAdminUser({
    username: DEFAULT_ADMIN_USERNAME,
    displayName: buildAdminDisplayName(DEFAULT_ADMIN_USERNAME),
    passwordHash,
    mustChangePassword: true,
  });

  return createdUser.id;
}

export async function verifyAdminCredentials(username: string, password: string) {
  const adminUser = await findAdminUserByUsername(username);

  if (!adminUser) {
    return null;
  }

  const passwordMatched = await verifyPassword(adminUser.passwordHash, password);

  if (!passwordMatched) {
    return null;
  }

  return toAdminSessionUser(adminUser);
}

export async function changeAdminPassword(adminUserId: number, password: string, confirmPassword: string) {
  if (!password || !confirmPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: '新密码和确认密码不能为空',
    });
  }

  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: '新密码长度至少为 8 位',
    });
  }

  if (password === DEFAULT_ADMIN_PASSWORD) {
    throw createError({
      statusCode: 400,
      statusMessage: '新密码不能与初始密码相同',
    });
  }

  if (password !== confirmPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: '两次输入的密码不一致',
    });
  }

  const passwordHash = await hashPassword(password);
  const updatedAdminUser = await updateAdminUserPassword(adminUserId, passwordHash);

  return toAdminSessionUser(updatedAdminUser);
}
