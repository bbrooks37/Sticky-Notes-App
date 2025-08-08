// server.js

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
// The port is set by Render's environment variable.
const PORT = process.env.PORT || 10000;

// Configure CORS to allow requests from your Netlify frontend.
// This is critical for security and allows your frontend to talk to your backend.
const corsOptions = {
    origin: 'https://pronotestogo.netlify.app',
    optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions));

// Middleware to parse JSON bodies from incoming requests
app.use(express.json());

// Database connection
// We now include the SSL configuration needed for Render's database.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// GET all notes
app.get('/api/notes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST a new note
app.post('/api/notes', async (req, res) => {
    const { text, due_date, reminder_time } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO notes(text, due_date, reminder_time) VALUES($1, $2, $3) RETURNING *',
            [text, due_date, reminder_time]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE a note
app.put('/api/notes/:id', async (req, res) => {
    const { id } = req.params;
    const { text, pinned } = req.body;
    try {
        const result = await pool.query(
            'UPDATE notes SET text = $1, pinned = $2 WHERE id = $3 RETURNING *',
            [text, pinned, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE a note
app.delete('/api/notes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
