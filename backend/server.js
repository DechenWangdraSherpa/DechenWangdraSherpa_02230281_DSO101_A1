require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

// Validate and log environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing environment variables:', missingEnvVars);
  console.error('Available in process.env:', Object.keys(process.env).filter(k => k.startsWith('DB_') || k === 'NODE_ENV' || k === 'PORT'));
  process.exit(1);
}

console.log('✅ Environment variables loaded:');
console.log(`   DB_HOST: ${process.env.DB_HOST}`);
console.log(`   DB_USER: ${process.env.DB_USER}`);
console.log(`   DB_NAME: ${process.env.DB_NAME}`);
console.log(`   DB_PORT: ${process.env.DB_PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

const isProduction = process.env.NODE_ENV === 'production';
console.log(`   SSL Enabled: ${isProduction}`);

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10),
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Connection error handling
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('✅ Database connection established');
});

// Initialize database schema (non-blocking)
async function initializeSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tasks table ready (created or already exists)');
  } catch (err) {
    console.error('❌ Error initializing schema:', err.message);
  }
}

// Start schema initialization in background (don't block server startup)
initializeSchema();

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Todo API Backend is running',
    endpoints: ['/tasks', '/tasks/:id']
  });
});

// GET all tasks
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Database error in GET /tasks:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ADD task
app.post('/tasks', async (req, res) => {
  try {
    const { title } = req.body;

    const result = await pool.query(
      'INSERT INTO tasks(title) VALUES($1) RETURNING *',
      [title]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Database error in POST /tasks:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// UPDATE task
app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    await pool.query(
      'UPDATE tasks SET title=$1 WHERE id=$2',
      [title, id]
    );

    res.json('Task updated');
  } catch (err) {
    console.error('❌ Database error in PUT /tasks/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// DELETE task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM tasks WHERE id=$1',
      [id]
    );

    res.json('Task deleted');
  } catch (err) {
    console.error('❌ Database error in DELETE /tasks/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// Start server immediately (schema init runs in background)
app.listen(process.env.PORT || 5000, () => {
  console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
});