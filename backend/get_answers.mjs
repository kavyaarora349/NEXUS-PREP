import dotenv from 'dotenv';
dotenv.config();
import { pool } from './db.js';

async function run() {
    try {
        const res = await pool.query(`SELECT answers FROM test_attempts WHERE status = 'IN_PROGRESS' ORDER BY id DESC LIMIT 1`);
        if (res.rows.length) {
            console.log(JSON.stringify(res.rows[0].answers, null, 2));
        } else {
            const res2 = await pool.query(`SELECT * FROM test_attempts ORDER BY id DESC LIMIT 10`);
            console.log(`No IN_PROGRESS tests. Found ${res2.rows.length} total. Last one answers:`);
            console.log(JSON.stringify(res2.rows[0].answers, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
