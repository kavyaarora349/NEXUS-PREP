import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Auto-create tables on boot up — no FK constraints so it works with any paper
const initTables = async () => {
    try {
        // Drop and recreate to apply schema changes (paper_json column, no FK)
        await pool.query(`
            DROP TABLE IF EXISTS test_events;
            DROP TABLE IF EXISTS test_attempts;
            CREATE TABLE test_attempts (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255),
                paper_id VARCHAR(255),
                paper_json JSONB,
                answers JSONB,
                selected_sets JSONB,
                score INTEGER DEFAULT 0,
                status VARCHAR(50) DEFAULT 'IN_PROGRESS',
                started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                submitted_at TIMESTAMP WITH TIME ZONE
            );
            CREATE TABLE test_events (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255),
                paper_id VARCHAR(255),
                event_type VARCHAR(100) NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('[TEST ROUTER] Tables ready.');
    } catch (e) {
        console.error('[TEST ROUTER] Init error:', e.message);
    }
};
initTables();

// 1. Start a Test Attempt — stores the full paper JSON so we don't need DB FK
router.post('/start', async (req, res) => {
    try {
        const { user_id, paper_id, paper_json } = req.body;
        if (!user_id) return res.status(400).json({ error: 'user_id required' });

        // Resume existing attempt if any
        const existing = await pool.query(
            "SELECT * FROM test_attempts WHERE user_id = $1 AND paper_id = $2 AND status = 'IN_PROGRESS'",
            [user_id, paper_id || 'unknown']
        );
        if (existing.rows.length > 0) {
            return res.json({ success: true, attemptId: existing.rows[0].id, answers: existing.rows[0].answers || [] });
        }

        const insert = await pool.query(
            "INSERT INTO test_attempts (user_id, paper_id, paper_json, answers, status) VALUES ($1, $2, $3::jsonb, '[]'::jsonb, 'IN_PROGRESS') RETURNING id",
            [user_id, paper_id || 'unknown', JSON.stringify(paper_json || {})]
        );
        res.json({ success: true, attemptId: insert.rows[0].id, answers: [] });
    } catch (err) {
        console.error('[/start] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. Auto-save answers and selected sets
router.post('/save-answer', async (req, res) => {
    try {
        const { attempt_id, answers, selected_sets } = req.body;
        if (!attempt_id) return res.status(400).json({ error: 'Missing attempt_id' });
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (answers !== undefined) {
            updates.push(`answers = $${paramIndex}::jsonb`);
            values.push(JSON.stringify(answers || []));
            paramIndex++;
        }

        if (selected_sets !== undefined) {
            updates.push(`selected_sets = $${paramIndex}::jsonb`);
            values.push(JSON.stringify(selected_sets || {}));
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No data to update' });
        }

        values.push(attempt_id);
        await pool.query(
            `UPDATE test_attempts SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            values
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[/save-answer] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Log Anti-Cheat Event
router.post('/log-event', async (req, res) => {
    try {
        const { user_id, paper_id, event_type } = req.body;
        if (!event_type) return res.status(400).json({ error: 'Missing event_type' });
        await pool.query(
            'INSERT INTO test_events (user_id, paper_id, event_type) VALUES ($1, $2, $3)',
            [user_id || 'unknown', paper_id || 'unknown', event_type]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[/log-event] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Build fallback evaluation from student answers when Gemini is unavailable or fails
// Includes all questions so UI can handle optional sets filtering
function buildFallbackEvaluation(studentAnswers) {
    const question_scores = (studentAnswers || []).map(a => {
        // Ensure we preserve the actual answer text
        const answerText = a.answer_text || '';
        return {
            original_question: a.question_text || '',
            student_answer: answerText || '(blank)',
            max_marks: a.max_marks ?? 0,
            marks_awarded: 0,
            feedback: answerText.trim()
                ? 'AI evaluation was unavailable. Your answers were saved. Please contact your instructor for manual grading.'
                : 'No answer provided for this question.'
        };
    });
    const total_score = 0;
    return { total_score, question_scores };
}

// 4. Submit & Evaluate using Gemini AI (with fallback when key missing or API fails)
router.post('/submit', async (req, res) => {
    const { attempt_id, selected_sets, strictness } = req.body;
    if (!attempt_id) return res.status(400).json({ error: 'attempt_id required' });
    try {
        // Save selected sets if provided
        if (selected_sets) {
            await pool.query(
                "UPDATE test_attempts SET selected_sets = $1::jsonb, status = 'SUBMITTED', submitted_at = CURRENT_TIMESTAMP WHERE id = $2",
                [JSON.stringify(selected_sets), attempt_id]
            );
        } else {
            await pool.query(
                "UPDATE test_attempts SET status = 'SUBMITTED', submitted_at = CURRENT_TIMESTAMP WHERE id = $1",
                [attempt_id]
            );
        }

        const attemptQ = await pool.query('SELECT * FROM test_attempts WHERE id = $1', [attempt_id]);
        if (attemptQ.rows.length === 0) return res.status(404).json({ error: 'Attempt not found' });
        const attempt = attemptQ.rows[0];

        const paperData = attempt.paper_json || {};
        const studentAnswers = Array.isArray(attempt.answers) ? attempt.answers : [];

        // Build question list and filter out "OR" markers
        const questionList = [];
        const sections = (paperData.sections || []);
        sections.forEach(section => {
            (section.questions || []).forEach(q => {
                if (q.text && String(q.text).toUpperCase() !== 'OR' && (q.marks || 0) > 0) {
                    questionList.push({ text: q.text, marks: q.marks });
                }
            });
        });

        // Filter student answers: only evaluate questions that have actual answers (not blank)
        // This handles optional sets - if student answered Set A, Set B questions can be blank
        const answeredQuestions = studentAnswers.filter(a =>
            a.answer_text && String(a.answer_text).trim().length > 0
        );

        let evaluation = { total_score: 0, question_scores: [] };
        const apiKey = process.env.GEMINI_API_KEY;

        console.log(`[SUBMIT] Attempt ${attempt_id}: API Key present: ${!!apiKey}, API Key length: ${apiKey ? apiKey.length : 0}, Answered questions: ${answeredQuestions.length}`);
        console.log(`[SUBMIT] Student answers count: ${studentAnswers.length}, Answered questions count: ${answeredQuestions.length}`);

        if (apiKey && answeredQuestions.length > 0) {
            // Match answered questions to paper questions by text
            const matchedPairs = answeredQuestions.map(ans => {
                const paperQ = questionList.find(q => q.text === ans.question_text);
                return paperQ ? { question: paperQ, answer: ans } : null;
            }).filter(pair => pair !== null);

            if (matchedPairs.length > 0) {
                let strictnessInstruction = "Evaluate the answers normally and fairly.";
                if (strictness === 'chill') {
                    strictnessInstruction = "EVALUATOR PERSONA: You are a very 'chill' and lenient evaluator. Award maximum possible marks generously for any relevant points, ignore minor mistakes, and give the benefit of the doubt.";
                } else if (strictness === 'strict') {
                    strictnessInstruction = "EVALUATOR PERSONA: You are a very 'strict' and rigorous evaluator. Deduct marks ruthlessly for missing details, missing keywords, and poor structure. Be harsh but fair.";
                }

                const prompt = `You are a university professor evaluating exam answers.

IMPORTANT: Students only need to answer ONE set per unit (Set A OR Set B). Only evaluate questions that have answers.
${strictnessInstruction}

Questions and student answers:
${matchedPairs.map((pair, i) => {
                    const q = pair.question;
                    const a = pair.answer;
                    return `Q${i + 1} [${q.marks}M]: ${q.text}\nAnswer: ${(a.answer_text || '').toString().slice(0, 1000)}`;
                }).join('\n\n')}

For each question, award marks out of max marks and write brief feedback.
Return ONLY raw JSON (no markdown fences, no code blocks):
{"total_score":0,"question_scores":[{"original_question":"...","student_answer":"...","max_marks":10,"marks_awarded":7,"feedback":"..."}]}`;

                try {
                    console.log(`[SUBMIT] Calling Gemini API with ${matchedPairs.length} questions...`);
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
                    const geminiRes = await fetch(geminiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.2,
                                responseMimeType: 'application/json'
                            }
                        })
                    });

                    if (geminiRes.ok) {
                        const geminiData = await geminiRes.json();
                        const rawText = (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '')
                            .replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
                        try {
                            evaluation = JSON.parse(rawText);
                            if (!Array.isArray(evaluation.question_scores)) {
                                evaluation.question_scores = [];
                            }

                            // Merge Gemini evaluation with original student answers to preserve full answer text
                            evaluation.question_scores = evaluation.question_scores.map((evalItem) => {
                                // Find the original answer for this question
                                // Gemini sometimes modifies the original_question text (e.g., adding "Q1 [10M]: ")
                                // So we use includes() and normalization to match safely
                                const originalAnswer = studentAnswers.find((a) => {
                                    if (!a.question_text || !evalItem.original_question) return false;
                                    const aText = String(a.question_text).replace(/[^a-z0-9]/gi, '').toLowerCase();
                                    const evalText = String(evalItem.original_question).replace(/[^a-z0-9]/gi, '').toLowerCase();
                                    return evalText.includes(aText) || aText.includes(evalText);
                                });

                                // Preserve the original full answer text
                                return {
                                    ...evalItem,
                                    student_answer: originalAnswer?.answer_text || evalItem.student_answer || '(blank)',
                                    original_question: originalAnswer?.question_text || evalItem.original_question || ''
                                };
                            });

                            // Ensure all student answers are included (in case Gemini missed some, and for un-submitted blank questions)
                            studentAnswers.forEach((ans) => {
                                const exists = evaluation.question_scores.some((item) => {
                                    if (!ans.question_text || !item.original_question) return false;
                                    const aText = String(ans.question_text).replace(/[^a-z0-9]/gi, '').toLowerCase();
                                    const evalText = String(item.original_question).replace(/[^a-z0-9]/gi, '').toLowerCase();
                                    return evalText.includes(aText) || aText.includes(evalText);
                                });

                                if (!exists) {
                                    const isEmpty = !ans.answer_text || !String(ans.answer_text).trim();
                                    evaluation.question_scores.push({
                                        original_question: ans.question_text || '',
                                        student_answer: ans.answer_text || '(blank)',
                                        max_marks: ans.max_marks ?? 0,
                                        marks_awarded: 0,
                                        feedback: isEmpty
                                            ? 'No answer provided for this question.'
                                            : 'Question was answered but not evaluated by AI.'
                                    });
                                }
                            });

                            const evaluatedCount = evaluation.question_scores.length;
                            console.log(`[SUBMIT] Gemini evaluated successfully. Total questions recorded: ${evaluatedCount}`);
                        } catch (parseErr) {
                            console.error('[/submit] Gemini JSON parse failed:', parseErr.message);
                            console.error('[/submit] Raw response (first 500 chars):', rawText.substring(0, 500));
                            evaluation = buildFallbackEvaluation(studentAnswers);
                        }
                    } else {
                        const errBody = await geminiRes.text();
                        console.error('[/submit] Gemini API error', geminiRes.status, errBody.substring(0, 500));
                        evaluation = buildFallbackEvaluation(studentAnswers);
                    }
                } catch (geminiErr) {
                    console.error('[/submit] Gemini request failed:', geminiErr.message);
                    console.error('[/submit] Stack:', geminiErr.stack?.substring(0, 300));
                    evaluation = buildFallbackEvaluation(studentAnswers);
                }
            } else {
                console.warn('[/submit] No matching questions found between paper and answers.');
                evaluation = buildFallbackEvaluation(studentAnswers);
            }
        } else {
            if (!apiKey) {
                console.warn('[/submit] GEMINI_API_KEY not set or empty; using fallback evaluation.');
                console.warn('[/submit] Check if .env file is loaded and GEMINI_API_KEY is set.');
            } else {
                console.warn('[/submit] No answered questions found; using fallback evaluation.');
            }
            console.log(`[SUBMIT] Building fallback evaluation with ${studentAnswers.length} answers`);
            evaluation = buildFallbackEvaluation(studentAnswers);
        }

        await pool.query(
            "UPDATE test_attempts SET score = $1, answers = $2::jsonb, status = 'GRADED' WHERE id = $3",
            [evaluation.total_score ?? 0, JSON.stringify(evaluation.question_scores || []), attempt_id]
        );

        res.json({ success: true, attempt_id, total_score: evaluation.total_score ?? 0 });
    } catch (err) {
        console.error('[/submit] Error:', err.message, '\n', err.stack?.substring(0, 500));
        res.status(500).json({ error: err.message });
    }
});

// 5. Fetch graded result
router.get('/result/:attemptId', async (req, res) => {
    try {
        const { attemptId } = req.params;
        const result = await pool.query('SELECT * FROM test_attempts WHERE id = $1', [attemptId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Result not found' });
        res.json({ success: true, result: result.rows[0] });
    } catch (err) {
        console.error('[/result] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

export default router;
