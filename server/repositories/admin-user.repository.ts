import { usePrismaClient } from '../utils/prisma';

interface CreateAdminUserInput {
  username: string;
  displayName: string;
  passwordHash: string;
  mustChangePassword: boolean;
}

export async function findAdminUserByUsername(username: string) {
  return usePrismaClient().adminUser.findUnique({
    where: {
      username,
    },
  });
}

export async function createAdminUser(input: CreateAdminUserInput) {
  return usePrismaClient().adminUser.create({
    data: {
      username: input.username,
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      mustChangePassword: input.mustChangePassword,
    },
  });
}

export async function updateAdminUserPassword(adminUserId: number, passwordHash: string) {
  return usePrismaClient().adminUser.update({
    where: {
      id: adminUserId,
    },
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordUpdatedAt: new Date(),
    },
  });
}
