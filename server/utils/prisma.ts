import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

export function resolveDatabaseUrl(runtimeDatabaseUrl: string, environmentDatabaseUrl = process.env.DATABASE_URL) {
  const normalizedEnvironmentDatabaseUrl = environmentDatabaseUrl?.trim();

  if (normalizedEnvironmentDatabaseUrl) {
    return normalizedEnvironmentDatabaseUrl;
  }

  return runtimeDatabaseUrl;
}

export function usePrismaClient() {
  if (!globalForPrisma.prisma) {
    const config = useRuntimeConfig();
    const databaseUrl = resolveDatabaseUrl(config.databaseUrl);
    const adapter = new PrismaMariaDb(databaseUrl);

    globalForPrisma.prisma = new PrismaClient({
      adapter: adapter,
    });
  }

  return globalForPrisma.prisma;
}
