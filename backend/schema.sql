-- schema.sql

-- Drop tables if they exist to allow clean initialization
DROP TABLE IF EXISTS papers;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY, -- Can accommodate string IDs (e.g., Firebase Auth UI, Clerk, or UUIDs)
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    university VARCHAR(255),
    semester VARCHAR(50),
    theme VARCHAR(50) DEFAULT 'Dark'
);

-- Create papers table
CREATE TABLE papers (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    semester VARCHAR(50) NOT NULL,
    student_name VARCHAR(255),
    full_json_data JSONB NOT NULL, -- Store the entire paper object as JSONB for flexible querying and storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
