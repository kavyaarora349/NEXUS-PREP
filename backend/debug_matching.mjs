import dotenv from 'dotenv';
dotenv.config();
import { pool } from './db.js';

async function run() {
    try {
        const res = await pool.query(`SELECT answers, paper_json FROM test_attempts ORDER BY id DESC LIMIT 1`);
        if (res.rows.length) {
            const paperData = res.rows[0].paper_json;
            const studentAnswers = res.rows[0].answers;

            const questionList = [];
            const sections = (paperData.sections || []);
            sections.forEach(section => {
                (section.questions || []).forEach(q => {
                    if (q.text && String(q.text).toUpperCase() !== 'OR' && (q.marks || 0) > 0) {
                        questionList.push({ text: q.text, marks: q.marks });
                    }
                });
            });

            const answeredQuestions = studentAnswers.filter(a =>
                a.answer_text && String(a.answer_text).trim().length > 0
            );

            console.log("Paper Questions count:", questionList.length);
            console.log("Student answered count:", answeredQuestions.length);

            const matchedPairs = answeredQuestions.map(ans => {
                const paperQ = questionList.find(q => q.text === ans.question_text);
                return paperQ ? { question: paperQ, answer: ans } : null;
            }).filter(pair => pair !== null);

            console.log("Matched pairs count:", matchedPairs.length);

            if (matchedPairs.length === 0 && answeredQuestions.length > 0) {
                console.log("Q1 paper: ", questionList[0].text);
                console.log("Q1 ans: ", answeredQuestions[0].question_text);
            }

        } else {
            console.log('No tests found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
