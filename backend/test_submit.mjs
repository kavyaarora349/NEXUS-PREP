import dotenv from 'dotenv';
dotenv.config();
import { pool } from './db.js';
import { GoogleGenAI } from '@google/genai';

console.log('[1] GEMINI_API_KEY set?', !!process.env.GEMINI_API_KEY);

// Test DB connection
try {
    const r = await pool.query("SELECT 1");
    console.log('[2] DB connected OK');
} catch (e) { console.error('[2] DB error:', e.message); }

// Test Gemini
try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('[3] GoogleGenAI created OK');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Say "HELLO" as JSON: {"message":"HELLO"}',
    });
    console.log('[4] Gemini response text:', response.text?.substring(0, 100));
} catch (e) { console.error('[3/4] Gemini error:', e.message, e.stack?.substring(0, 300)); }

// Test a fake submit call
try {
    // Insert a test attempt
    const ins = await pool.query(
        "INSERT INTO test_attempts (user_id, paper_id, paper_json, answers, status) VALUES ($1,$2,$3::jsonb,$4::jsonb,'IN_PROGRESS') RETURNING id",
        ['debug@test.com', 'test-paper', JSON.stringify({ sections: [{ questions: [{ text: 'What is OSI?', marks: 10 }] }] }), JSON.stringify([{ question_text: 'What is OSI?', max_marks: 10, answer_text: 'OSI is a 7 layer model' }])]
    );
    const attemptId = ins.rows[0].id;
    console.log('[5] Test attempt inserted, id:', attemptId);

    // Call Gemini evaluation
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Evaluate: Q1 [10M]: What is OSI?\nStudent: OSI is a 7 layer model\nReturn JSON: {"total_score":7,"question_scores":[{"original_question":"What is OSI?","student_answer":"OSI is a 7 layer model","max_marks":10,"marks_awarded":7,"feedback":"Good answer"}]}`
    });
    let raw = (response.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    console.log('[6] Gemini eval text:', raw.substring(0, 200));
    const evaluation = JSON.parse(raw);
    await pool.query("UPDATE test_attempts SET score=$1, answers=$2::jsonb, status='GRADED' WHERE id=$3", [evaluation.total_score, JSON.stringify(evaluation.question_scores), attemptId]);
    console.log('[7] SUCCESS - Score:', evaluation.total_score);
    await pool.query("DELETE FROM test_attempts WHERE id=$1", [attemptId]);
} catch (e) { console.error('[5-7] Submit test error:', e.message, e.stack?.substring(0, 500)); }

process.exit(0);
