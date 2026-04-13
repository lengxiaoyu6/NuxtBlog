import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

export function usePrismaClient() {
  if (!globalForPrisma.prisma) {
    const config = useRuntimeConfig();
    const adapter = new PrismaMariaDb(config.databaseUrl);

    globalForPrisma.prisma = new PrismaClient({
      adapter: adapter,
    });
  }

  return globalForPrisma.prisma;
}
