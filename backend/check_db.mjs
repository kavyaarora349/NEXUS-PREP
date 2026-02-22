import dotenv from 'dotenv';
dotenv.config();
import { pool } from './db.js';

async function run() {
    try {
        const res = await pool.query('SELECT * FROM test_attempts ORDER BY id DESC LIMIT 1');
        console.log(JSON.stringify(res.rows[0], null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
