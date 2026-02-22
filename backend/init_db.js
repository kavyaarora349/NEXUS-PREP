require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runSchema() {
    try {
        console.log("Reading schema.sql...");
        const sqlPath = path.join(__dirname, 'schema.sql');
        const schemaText = fs.readFileSync(sqlPath, 'utf8');

        console.log("Executing schema SQL queries against Supabase...");
        await pool.query(schemaText);
        console.log("✅ Tables created successfully!");
    } catch (error) {
        console.error("❌ Error running schema.sql:", error);
    } finally {
        await pool.end();
    }
}

runSchema();
