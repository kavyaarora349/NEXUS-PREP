import dotenv from 'dotenv';
dotenv.config();
import { pool } from './db.js';

async function run() {
    try {
        const res = await pool.query(`SELECT answers FROM test_attempts WHERE status = 'GRADED' ORDER BY id DESC LIMIT 1`);
        if (res.rows.length) {
            console.log(JSON.stringify(res.rows[0].answers, null, 2));
        } else {
            console.log('No GRADED tests found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
