import { drizzle } from 'drizzle-orm/node-postgres';
import { getDbPool } from './neonClient';
import * as schema from '../schema';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDb() {
  if (!db) {
    const pool = await getDbPool();
    db = drizzle(pool, { schema });
  }
  return db;
}

export { schema }; 