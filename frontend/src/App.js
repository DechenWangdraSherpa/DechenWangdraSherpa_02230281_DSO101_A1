import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './App.css';

// Set global axios timeout to 10 seconds
axios.defaults.timeout = 10000;

function App() {

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState(null);

  const API = process.env.REACT_APP_API_URL;

  // Debug: Log API URL on mount
  useEffect(() => {
    console.log('🔗 API URL:', API);
    if (!API) {
      console.error('❌ REACT_APP_API_URL is not set!');
    }
  }, [API]);

  // Fetch tasks
  const getTasks = useCallback(async () => {
    if (!API) {
      console.warn('⚠️ Cannot fetch tasks: API URL not configured');
      return;
    }
    try {
      const res = await axios.get(`${API}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error('❌ Error fetching tasks:', err.response?.status, err.message);
    }
  }, [API]);

  useEffect(() => {
    if (API) {
      getTasks();
    }
  }, [getTasks, API]);

  // Add or Update task
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!API) {
      alert('❌ API URL not configured. Check environment variables.');
      return;
    }

    if (!title.trim()) return;

    try {
      if (editingId) {
        // Optimistic update for edit
        setTasks(tasks.map(task => 
          task.id === editingId ? { ...task, title } : task
        ));
        
        await axios.put(`${API}/tasks/${editingId}`, { title });
        setEditingId(null);
      } else {
        // Optimistic update for add - add with temp ID
        const tempTask = { id: Date.now(), title };
        setTasks([...tasks, tempTask]);
        
        const res = await axios.post(`${API}/tasks`, { title });
        // Replace temp task with real one from server
        setTasks(tasks.filter(t => t.id !== tempTask.id));
        setTasks(prev => [...prev, res.data]);
      }

      setTitle('');
    } catch (err) {
      console.error('❌ Error submitting task:', err.response?.status, err.message);
      alert('Error: ' + (err.response?.data?.error || err.message));
      getTasks(); // Refetch on error to sync UI
    }
  };

  // Edit task
  const editTask = (task) => {
    setTitle(task.title);
    setEditingId(task.id);
  };

  // Delete task
  const deleteTask = async (id) => {
    if (!API) {
      alert('❌ API URL not configured');
      return;
    }
    try {
      // Optimistic delete
      setTasks(tasks.filter(task => task.id !== id));
      
      await axios.delete(`${API}/tasks/${id}`);
    } catch (err) {
      console.error('❌ Error deleting task:', err.response?.status, err.message);
      alert('Error: ' + (err.response?.data?.error || err.message));
      getTasks(); // Refetch on error to sync UI
    }
  };

  return (
    <div className="container">

      <h1>To-Do App (Testing Automated CICD)</h1>

      {!API && (
        <div style={{
          background: 'rgba(255, 0, 0, 0.2)',
          border: '2px solid red',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          color: '#ff6b6b'
        }}>
          ❌ <strong>Error:</strong> REACT_APP_API_URL is not configured. Backend connection failed.
        </div>
      )}

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          placeholder="Enter task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <button type="submit" disabled={!API}>
          {editingId ? 'Update' : 'Add'}
        </button>

      </form>

      <div className="task-list">

        {tasks.map((task) => (

          <div className="task" key={task.id}>

            <span>{task.title}</span>

            <div>

              <button onClick={() => editTask(task)}>
                Edit
              </button>

              <button onClick={() => deleteTask(task.id)}>
                Delete
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default App;