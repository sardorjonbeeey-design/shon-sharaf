import pg from 'pg';
import { config } from './config.js';
const { Pool } = pg;
export const pool = config.databaseUrl ? new Pool({
 connectionString: config.databaseUrl,
 ssl: config.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: true },
 max: 8, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000
}) : null;
export function requireDb() {
 if (!pool) throw Object.assign(new Error('Database is not configured'), { status: 503 });
 return pool;
}
export async function inTransaction(fn) {
 const client = await requireDb().connect();
 try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
 catch (error) { await client.query('ROLLBACK'); throw error; }
 finally { client.release(); }
}

export async function assertIsolatedDatabase(clientOrPool) {
 const result=await clientOrPool.query('SELECT current_database() AS database_name');
 if(result.rows[0]?.database_name!==config.expectedDatabaseName) throw new Error('Refusing database connection: expected isolated database '+config.expectedDatabaseName);
}
