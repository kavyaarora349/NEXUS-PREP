import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('[DB] Error acquiring client', err.stack);
    } else {
        console.log('[DB] Connected to PostgreSQL.');
        release();
    }
});
