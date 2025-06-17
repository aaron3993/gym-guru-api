import { Pool } from 'pg';
import { getSSMParameter } from "../utils/parameterStore";
import { environments } from '../../lib/config/environment';

let pool: Pool | null = null;

export async function getDbPool(): Promise<Pool> {
  if (!pool) {
    const stage = process.env.STAGE || 'staging';
    const config = environments[stage];
    
    const dbUrl = await getSSMParameter("/neon-db-url");

    if (!dbUrl) throw new Error(`Database URL not found for stage: ${config.stage}`);
    
    pool = new Pool({
      connectionString: dbUrl,
      // Neon often requires SSL. You might need to adjust 'rejectUnauthorized'
      // based on your specific Neon setup and security requirements.
      // For production, 'rejectUnauthorized: true' is more secure if using a CA.
      // For development/testing, or if Neon's cert isn't recognized, you might use 'false'.
      ssl: {
        rejectUnauthorized: false, // Be cautious with 'false' in production.
      },
    });

    // Set up error handler after pool is created
    pool.on('error', (err: any) => {
      console.error('Unexpected error on idle client:', err);
    });
  }
  return pool;
}

export { pool };