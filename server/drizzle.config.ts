import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: '../shared/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'flirtmarket',
} satisfies Config; 