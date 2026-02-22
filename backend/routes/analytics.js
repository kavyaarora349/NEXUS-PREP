import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET /api/analytics?userId=someone@example.com
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // 1. Overview Stats (Total Tests, Avg Score)
        const overviewQuery = `
            SELECT 
                COUNT(*) as total_tests,
                ROUND(AVG(score), 1) as avg_score,
                MAX(score) as highest_score
            FROM test_attempts
            WHERE user_id = $1 AND status = 'GRADED';
        `;
        const overviewResult = await pool.query(overviewQuery, [userId]);
        const overview = overviewResult.rows[0];

        // 2. Timeline Data (Last 10 Tests)
        const timelineQuery = `
            SELECT 
                p.subject,
                a.score,
                a.submitted_at
            FROM test_attempts a
            JOIN papers p ON a.paper_id = CAST(p.id AS TEXT)
            WHERE a.user_id = $1 AND a.status = 'GRADED'
            ORDER BY a.submitted_at ASC
            LIMIT 10;
        `;
        const timelineResult = await pool.query(timelineQuery, [userId]);

        // Format timeline dates for the chart
        const timeline = timelineResult.rows.map(row => ({
            name: new Date(row.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            score: row.score,
            subject: row.subject
        }));

        // 3. Subject Performance (Avg Score per Subject)
        const subjectQuery = `
            SELECT 
                p.subject as name,
                ROUND(AVG(a.score), 1) as avgScore,
                COUNT(a.id) as attempts
            FROM test_attempts a
            JOIN papers p ON a.paper_id = CAST(p.id AS TEXT)
            WHERE a.user_id = $1 AND a.status = 'GRADED'
            GROUP BY p.subject
            ORDER BY avgScore DESC;
        `;
        const subjectResult = await pool.query(subjectQuery, [userId]);

        res.json({
            overview: {
                totalTests: parseInt(overview.total_tests) || 0,
                avgScore: parseFloat(overview.avg_score) || 0,
                highestScore: parseInt(overview.highest_score) || 0
            },
            timeline: timeline,
            subjectPerformance: subjectResult.rows.map(r => ({
                name: r.name,
                avgScore: parseFloat(r.avgscore),
                attempts: parseInt(r.attempts)
            }))
        });

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

export default router;
