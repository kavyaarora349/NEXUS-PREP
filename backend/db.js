import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // Keep-alive settings to prevent connection timeout
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Database keep-alive: Periodically query the database to keep connection alive
let keepAliveInterval = null;

export const startDatabaseKeepAlive = () => {
    // Run a simple query every 3 minutes to keep the connection alive
    keepAliveInterval = setInterval(async () => {
        try {
            await pool.query('SELECT 1');
            console.log('[DB] Keep-alive ping sent');
        } catch (error) {
            console.error('[DB] Keep-alive ping failed:', error);
        }
    }, 3 * 60 * 1000); // 3 minutes
};

export const stopDatabaseKeepAlive = () => {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
};

// Warmup function to establish database connection on server start
export const warmupDatabase = async () => {
    try {
        console.log('[DB] Warming up database connection...');
        const result = await pool.query('SELECT 1 as test');
        console.log('[DB] Database warmup successful:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('[DB] Database warmup failed:', error);
        return false;
    }
};

pool.connect((err, client, release) => {
    if (err) {
        console.error('[DB] Error acquiring client', err.stack);
    } else {
        console.log('[DB] Connected to PostgreSQL.');
        release();
    }
});
