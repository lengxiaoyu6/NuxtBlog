import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

process.env.DATABASE_URL ||= 'mysql://root:password@127.0.0.1:3306/nuxt-blog';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
