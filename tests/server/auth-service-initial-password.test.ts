import { afterEach, describe, expect, it, vi } from 'vitest';

const findAdminUserByUsername = vi.hoisted(() => vi.fn());
const createAdminUser = vi.hoisted(() => vi.fn());
const updateAdminUserPassword = vi.hoisted(() => vi.fn());

vi.mock('../../server/repositories/admin-user.repository', () => ({
  createAdminUser,
  findAdminUserByUsername,
  updateAdminUserPassword,
}));

vi.stubGlobal('verifyPassword', vi.fn(async () => true));
vi.stubGlobal('hashPassword', vi.fn(async () => 'hashed-password'));
vi.stubGlobal('createError', (input: unknown) => input);

describe('verifyAdminCredentials', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('requires first password setup when the admin still logs in with the default password', async () => {
    findAdminUserByUsername.mockResolvedValue({
      id: 1,
      username: 'admin',
      displayName: '站点管理员',
      passwordHash: 'legacy-default-password-hash',
      mustChangePassword: false,
    });

    const { verifyAdminCredentials } = await import('../../server/services/auth.service');

    const sessionUser = await verifyAdminCredentials('admin', 'admin123');

    expect(sessionUser).toEqual({
      id: 1,
      username: 'admin',
      displayName: '站点管理员',
      mustChangePassword: true,
    });
  });
});
