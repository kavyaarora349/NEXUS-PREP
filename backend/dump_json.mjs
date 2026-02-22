import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
import { pool } from './db.js';

async function run() {
    try {
        const res = await pool.query(`SELECT answers FROM test_attempts WHERE id = 5`);
        if (res.rows.length) {
            fs.writeFileSync('test_answers_5.json', JSON.stringify(res.rows[0].answers, null, 2));
            console.log("Saved to test_answers_5.json");
        } else {
            console.log("No attempt 5");
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
