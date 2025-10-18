'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '@/lib/config'
import { formatTimestamp } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
  completed_at: string | null
  priority: 'low' | 'medium' | 'high'
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' })
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'medium' })

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/tasks'))
      setTasks(response.data.tasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(getApiUrl('/api/tasks'), newTask)
      setNewTask({ title: '', description: '', priority: 'medium' })
      setShowAddForm(false)
      fetchTasks()
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status })
      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`/api/tasks/${taskId}`)
        fetchTasks()
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const startEdit = (task: Task) => {
    setEditingTask(task)
    setEditForm({
      title: task.title,
      description: task.description,
      priority: task.priority
    })
  }

  const cancelEdit = () => {
    setEditingTask(null)
    setEditForm({ title: '', description: '', priority: 'medium' })
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask) return

    try {
      await axios.put(`/api/tasks/${editingTask.id}`, editForm)
      setEditingTask(null)
      setEditForm({ title: '', description: '', priority: 'medium' })
      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  if (loading) {
    return (
      <div className="govuk-grid">
        <div className="govuk-main-wrapper">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-blue mx-auto"></div>
            <p className="mt-2 text-gov-grey-dark">Loading tasks...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="govuk-grid">
      <div className="govuk-main-wrapper">
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-full">
            <br/>
            <h1 className="govuk-heading-xl">Task Management</h1>
            <p className="govuk-body-l">
              Manage your work tasks and track progress
            </p>
          </div>
        </div>

        {/* Add Task Button */}
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-full">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="govuk-button govuk-button--primary"
            >
              {showAddForm ? 'Cancel' : '+ Add New Task'}
            </button>
          </div>
        </div>

        {/* Add Task Form */}
        {showAddForm && (
          <div className="govuk-grid-row">
            <div className="govuk-grid-column-two-thirds">
              <div className="govuk-card">
                <div className="govuk-card__content">
                  <h2 className="govuk-heading-m">Add New Task</h2>
                  <form onSubmit={addTask}>
                    <div className="govuk-form-group">
                      <label className="govuk-label" htmlFor="task-title">
                        Task Title
                      </label>
                      <input
                        className="govuk-input"
                        id="task-title"
                        name="title"
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="govuk-form-group">
                      <label className="govuk-label" htmlFor="task-description">
                        Description
                      </label>
                      <textarea
                        className="govuk-textarea"
                        id="task-description"
                        name="description"
                        rows={3}
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      />
                    </div>

                    <div className="govuk-form-group">
                      <label className="govuk-label" htmlFor="task-priority">
                        Priority
                      </label>
                      <select
                        className="govuk-select"
                        id="task-priority"
                        name="priority"
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <button type="submit" className="govuk-button">
                      Add Task
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Task Form */}
        {editingTask && (
          <div className="govuk-grid-row">
            <div className="govuk-grid-column-two-thirds">
              <div className="govuk-card">
                <div className="govuk-card__content">
                  <h2 className="govuk-heading-m">Edit Task</h2>
                  <form onSubmit={saveEdit}>
                    <div className="govuk-form-group">
                      <label className="govuk-label" htmlFor="edit-title">
                        Task Title
                      </label>
                      <input
                        className="govuk-input"
                        id="edit-title"
                        name="title"
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="govuk-form-group">
                      <label className="govuk-label" htmlFor="edit-description">
                        Description
                      </label>
                      <textarea
                        className="govuk-textarea"
                        id="edit-description"
                        name="description"
                        rows={3}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                    </div>

                    <div className="govuk-form-group">
                      <label className="govuk-label" htmlFor="edit-priority">
                        Priority
                      </label>
                      <select
                        className="govuk-select"
                        id="edit-priority"
                        name="priority"
                        value={editForm.priority}
                        onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="govuk-form-group">
                      <button type="submit" className="govuk-button">
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="govuk-button govuk-button--secondary"
                        style={{ marginLeft: '10px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Table */}
        <br/>
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-full">
            <div className="govuk-card">
              <div className="govuk-card__content">
                <h2 className="govuk-heading-m">Your Tasks</h2>
                
                {tasks.length === 0 ? (
                  <p className="govuk-body">No tasks yet. Add your first task above!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="govuk-table">
                      <thead className="govuk-table__head">
                        <tr className="govuk-table__row">
                          <th className="govuk-table__header">Task</th>
                          <th className="govuk-table__header">Priority</th>
                          <th className="govuk-table__header">Status</th>
                          <th className="govuk-table__header">Created</th>
                          <th className="govuk-table__header">Completed</th>
                          <th className="govuk-table__header">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="govuk-table__body">
                        {tasks.map((task) => (
                          <tr key={task.id} className="govuk-table__row">
                            <td className="govuk-table__cell">
                              <div>
                                <strong>{task.title}</strong>
                                {task.description && (
                                  <p className="govuk-body-s text-gov-grey-dark mt-1">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="govuk-table__cell">
                              <span className={`govuk-tag ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="govuk-table__cell">
                              <span className={`govuk-tag ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="govuk-table__cell">
                              {formatTimestamp(task.created_at)}
                            </td>
                            <td className="govuk-table__cell">
                              {task.completed_at ? formatTimestamp(task.completed_at) : '-'}
                            </td>
                            <td className="govuk-table__cell">
                              <div style={{display: 'flex', gap: '5px'}}>
                                {task.status !== 'completed' && (
                                  <button
                                    onClick={() => updateTaskStatus(task.id, 'completed')}
                                    className="govuk-button govuk-button--primary"
                                    style={{padding: '4px 8px', fontSize: '12px'}}
                                  >
                                    Complete
                                  </button>
                                )}
                                <button
                                  onClick={() => startEdit(task)}
                                  className="govuk-button govuk-button--secondary"
                                  style={{padding: '4px 8px', fontSize: '12px'}}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="govuk-button govuk-button--warning"
                                  style={{padding: '4px 8px', fontSize: '12px'}}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
