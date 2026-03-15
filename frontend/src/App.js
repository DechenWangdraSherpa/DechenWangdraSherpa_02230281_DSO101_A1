import { useState, useEffect } from "react"
import axios from "axios"
import "./App.css"

const API = process.env.REACT_APP_API_URL

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState("")

  const getTasks = async () => {
    const res = await axios.get(`${API}/tasks`)
    setTasks(res.data)
  }

  const addTask = async () => {
    if (!title.trim()) return
    await axios.post(`${API}/tasks`, { title })
    setTitle("")
    getTasks()
  }

  const deleteTask = async (id) => {
    await axios.delete(`${API}/tasks/${id}`)
    getTasks()
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addTask()
  }

  useEffect(() => {
    getTasks()
  }, [])

  return (
    <div className="app-wrapper">
      <div className="card">

        {/* Header */}
        <div className="card-header">
          <div className="badge">Workspace</div>
          <h1>My Tasks</h1>
          <p className="subtitle">Stay organized, stay focused.</p>
        </div>

        {/* Input */}
        <div className="input-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new task..."
          />
          <button className="add-btn" onClick={addTask}>+ Add</button>
        </div>

        {/* Task List */}
        {tasks.length > 0 && (
          <div className="section-label">Active tasks</div>
        )}

        <ul className="task-list">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✦</div>
              <p className="empty-text">No tasks yet. Add one above.</p>
            </div>
          ) : (
            tasks.map((task, i) => (
              <li
                className="task-item"
                key={task.id}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="task-left">
                  <div className="task-dot" />
                  <span className="task-title">{task.title}</span>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => deleteTask(task.id)}
                  title="Delete task"
                >
                  ✕
                </button>
              </li>
            ))
          )}
        </ul>

        {/* Footer */}
        <div className="footer-bar">
          <p className="count-text">
            <span>{tasks.length}</span> {tasks.length === 1 ? "task" : "tasks"} total
          </p>
          <div className="divider-line" />
          <div className="status-dot">Connected</div>
        </div>

      </div>
    </div>
  )
}

export default App