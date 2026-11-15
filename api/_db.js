// The database: Neon Postgres over HTTP, one request per query, no connection pool to keep (cloud-sync.md 5.1).
// Two branches of one Neon project (2026-11-15, TASKS 2.1):
//   Production  — DATABASE_URL, branch `main`, set by the Neon integration of the Vercel project (Production only in
//                 spirit: the integration still sets it everywhere, so it is never read outside production);
//   Preview, Development and a developer's machine — DATABASE_URL_DEV, branch `dev` (schema only, no parents' data).
// Outside production there is no falling back to `main`: without DATABASE_URL_DEV the server stops with a clear error,
// so a test can never write into the real accounts. Neither address is in the repository or in the app.
import { neon } from '@neondatabase/serverless';

export const PRODUCTION = process.env.VERCEL_ENV === 'production';
export const DB_URL = PRODUCTION ? process.env.DATABASE_URL : process.env.DATABASE_URL_DEV;
if (!DB_URL) throw new Error(PRODUCTION ? 'DATABASE_URL is not set' : 'DATABASE_URL_DEV is not set: outside production the server uses the Neon branch `dev` (server/README.md, «База»)');

export const sql = neon(DB_URL);
