import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from 'node:process';

// Create PostgreSQL connection
export const pool = new pg.Pool({
  connectionString: env.SUPABASE_URL!,
});

// Initialize Drizzle ORM with the PostgreSQL connection
export const db = drizzle(pool);

// Export the database connection for use in other files
export default db;
