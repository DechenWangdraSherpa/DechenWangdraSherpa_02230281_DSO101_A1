require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

const app = express()

app.use(cors())
app.use(express.json())

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
})

app.get('/tasks', async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks')
  res.json(result.rows)
})

app.post('/tasks', async (req, res) => {
  const { title } = req.body
  const result = await pool.query(
    'INSERT INTO tasks(title) VALUES($1) RETURNING *',
    [title]
  )
  res.json(result.rows[0])
})

app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params
  const { title } = req.body

  const result = await pool.query(
    'UPDATE tasks SET title=$1 WHERE id=$2 RETURNING *',
    [title, id]
  )

  res.json(result.rows[0])
})

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params

  await pool.query('DELETE FROM tasks WHERE id=$1', [id])

  res.json({ message: "Task deleted" })
})

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})
