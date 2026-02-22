import { pool } from './db.js';
import fs from 'fs';

async function run() {
    try {
        const res = await pool.query("SELECT * FROM test_attempts ORDER BY submitted_at DESC NULLS LAST LIMIT 1;");
        fs.writeFileSync('db_attempt.json', JSON.stringify(res.rows[0], null, 2), 'utf-8');
    } catch (e) { console.error('DB ERROR:', e.message); }
    process.exit();
}
run();
