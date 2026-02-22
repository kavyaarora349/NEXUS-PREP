import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { pool } from './db.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());


// Basic health check route
app.get('/', (req, res) => {
    res.json({ message: 'Question Paper Generator API is running' });
});

// ==========================================
// Setup File Uploads (Multer)
// ==========================================
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Check for Python executable (Windows uses 'py', others use 'python' or 'python3')
const isWindows = process.platform === 'win32';
const PYTHON_CMD = isWindows ? 'py' : 'python3';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, `notes-${Date.now()}${path.extname(file.originalname)}`)
    }
});
const upload = multer({ storage: storage });

import testRoutes from './routes/test.js';
app.use('/api/test', testRoutes);

// ==========================================
// API Endpoints
// ==========================================

// POST /api/auth/signup: Create a new user account
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, name, university, semester, theme } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Check if user already exists
        const checkQuery = 'SELECT * FROM users WHERE email = $1';
        const checkResult = await pool.query(checkQuery, [email]);
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO users (id, email, password, name, university, semester, theme)
            VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'Dark'))
            RETURNING id, email, name, university, semester, theme;
        `;

        const values = [email, email, hashedPassword, name, university, semester, theme];
        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error in signup:', error);
        res.status(500).json({ error: 'Internal server error during signup' });
    }
});

// POST /api/auth/login: Authenticate a user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        if (!user.password) {
            return res.status(401).json({ error: 'Please sign up to set a password for this account.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        delete user.password;
        res.status(200).json(user);
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// PUT /api/auth/password: Securely update user password
app.put('/api/auth/password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Email, current password, and new password are required' });
        }

        // Fetch user from DB
        const query = 'SELECT password FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        if (!user.password) {
            return res.status(400).json({ error: 'No password set on this account. Please sign in via OAuth or contact support.' });
        }

        // Verify current password safely using bcrypt
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        // Hash the new password and save it
        const hashedNewPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
        await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedNewPassword, email]);

        console.log(`[AUTH] Password updated successfully for: ${email}`);
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal server error while updating password' });
    }
});

// POST /api/generate-paper: AI Generation via Python pipeline
app.post('/api/generate-paper', upload.array('notes', 10), async (req, res) => {
    try {
        const { subject, semester, user_id } = req.body;
        const files = req.files;

        if (!subject || !semester || !user_id || !files || files.length === 0) {
            return res.status(400).json({ success: false, error: 'Missing required fields (subject, semester, user_id, or notes files)' });
        }

        console.log(`[GENERATOR] Starting AI generation for ${subject} Sem ${semester} with ${files.length} files...`);

        // Ensure path resolves correctly if backend is started from root or from backend/
        const rootDir = process.cwd().endsWith('backend') ? path.join(process.cwd(), '..') : process.cwd();
        const pythonScriptPath = path.join(rootDir, 'backend', 'ml', 'generate_paper.py');
        const pdfPaths = files.map(f => f.path);

        console.log(`[GENERATOR] Executing: ${PYTHON_CMD} ${pythonScriptPath} "${subject}" ${semester} ...[${pdfPaths.length} files]`);

        // Execute Python
        const pythonProcess = spawn(PYTHON_CMD, [
            pythonScriptPath,
            subject,
            semester.toString(),
            ...pdfPaths
        ], { cwd: rootDir });

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
            console.error(`[PYTHON STDERR]: ${data.toString()}`);
        });

        pythonProcess.on('close', async (code) => {
            // Clean up all uploaded PDFs to save space
            files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error("Failed to delete temp PDF:", err);
                });
            });

            if (code !== 0) {
                console.error(`[GENERATOR] Python process exited with code ${code}`);
                return res.status(500).json({ success: false, error: 'AI Pipeline failed during execution. See server logs.' });
            }

            try {
                // The AI Python script prints the paper content (as a JSON string representing the paper or plain text).
                const paperText = outputData.trim();

                // If the python script fails cleanly, it might output a JSON error
                try {
                    const parsed = JSON.parse(paperText);
                    if (parsed.error) {
                        console.error('[GENERATOR] Pipeline Error:', parsed.error);
                        if (parsed.trace) console.error(parsed.trace);
                        return res.status(500).json({ success: false, error: parsed.error });
                    }
                } catch (e) {
                    // Ignore parsing error, it means the output is valid raw text/json representation
                }

                // Use the working PostgreSQL connection pool to insert data matching the schema
                const query = `
                  INSERT INTO papers (user_id, subject, semester, student_name, full_json_data)
                  VALUES ($1, $2, $3, $4, $5)
                  RETURNING *;
                `;
                const values = [user_id, subject, semester.toString(), "Student", paperText];

                try {
                    await pool.query(query, values);
                } catch (dbError) {
                    console.error('[GENERATOR] Supabase insertion error:', dbError);
                    return res.status(500).json({ success: false, error: 'Failed to insert paper into Supabase database' });
                }

                console.log(`[GENERATOR] Success! Saved to Supabase Database.`);

                // Return payload matching the exact structured response requested
                return res.status(200).json({
                    success: true,
                    paper: paperText
                });

            } catch (e) {
                console.error('[GENERATOR] Failed to process Python output:', e);
                console.error('[GENERATOR] Raw Output was:', outputData);
                return res.status(500).json({ success: false, error: 'Failed to process AI formatted output.' });
            }
        });

    } catch (error) {
        console.error('[GENERATOR] Server execution error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error during paper generation' });
    }
});


// 1. GET /api/profile/:userId: Fetch user profile from PostgreSQL
app.get('/api/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const query = 'SELECT * FROM users WHERE id = $1';
        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error while fetching profile' });
    }
});

// 2. PUT /api/profile/:userId: Upsert user profile (create or update)
app.put('/api/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, university, semester, theme } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required fields' });
        }

        const query = `
      UPDATE users 
      SET 
        name = $1,
        university = $2,
        semester = $3,
        theme = $4
      WHERE email = $5
      RETURNING *;
    `;

        const values = [name, university, semester, theme, email];
        console.log(`[PROFILE PUT] Received update for ${email}:`, { name, university, semester, theme });
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found in database to update' });
        }

        console.log(`[PROFILE PUT] Database updated successfully for ${email}`);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error upserting user profile:', error);
        res.status(500).json({ error: 'Internal server error while upserting profile' });
    }
});

// 3. POST /api/papers: Save a generated question paper
app.post('/api/papers', async (req, res) => {
    try {
        // Determine the expected fields matching the schema
        const { user_id, subject, semester, student_name, full_json_data } = req.body;

        if (!user_id || !subject || !semester || !full_json_data) {
            return res.status(400).json({ error: 'Missing required fields (user_id, subject, semester, full_json_data)' });
        }

        const query = `
      INSERT INTO papers (user_id, subject, semester, student_name, full_json_data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

        const values = [user_id, subject, semester, student_name, full_json_data];
        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error saving paper:', error);
        res.status(500).json({ error: 'Internal server error while saving paper' });
    }
});

// 4. GET /api/papers/:user_id: Fetch all papers for a specific user ordered by date
app.get('/api/papers/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;

        const query = `
      SELECT * FROM papers 
      WHERE user_id = $1 
      ORDER BY created_at DESC;
    `;
        const result = await pool.query(query, [user_id]);

        res.json(result.rows); // Returns empty array '[]' if no history found, which is standard
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Internal server error while fetching history' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    if (!process.env.DATABASE_URL) {
        console.warn('⚠️  DATABASE_URL environment variable is not set!');
    }
});
