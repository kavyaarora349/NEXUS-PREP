import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
import { pool } from './db.js';

async function run() {
    try {
        const res = await pool.query(`SELECT answers FROM test_attempts WHERE status = 'GRADED' ORDER BY id DESC LIMIT 1`);
        if (res.rows.length) {
            const answers = res.rows[0].answers;

            const aiQuestion = answers[0].original_question; // Q1 [10M]: Set A: ...
            const dbQuestion = answers[1].original_question; // Set A: 1) Explain ...

            console.log("aiQuestion:", JSON.stringify(aiQuestion));
            console.log("dbQuestion:", JSON.stringify(dbQuestion));

            const aText = String(dbQuestion).replace(/\s+/g, ' ').trim().toLowerCase();
            const evalText = String(aiQuestion).replace(/\s+/g, ' ').trim().toLowerCase();

            console.log("aText:", JSON.stringify(aText));
            console.log("evalText:", JSON.stringify(evalText));
            console.log("evalText.includes(aText):", evalText.includes(aText));

            const norm1 = String(dbQuestion).replace(/[^a-z0-9]/gi, '').toLowerCase();
            const norm2 = String(aiQuestion).replace(/[^a-z0-9]/gi, '').toLowerCase();
            console.log("norm2.includes(norm1):", norm2.includes(norm1));

        } else {
            console.log("No graded tests");
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
