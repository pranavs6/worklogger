'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '@/lib/config'
import { format } from 'date-fns'

interface DailyLog {
  date: string
  start_time: string | null
  end_time: string | null
  total_hours: number
  tasks: Array<{
    id: number
    description: string
    duration_minutes: number
    timestamp: string
    completed: boolean
  }>
  notes: string
  breaks: Array<{
    type: string
    duration_minutes: number
    timestamp: string
  }>
  status: 'online' | 'offline'
}

export default function DailyLoggerPage() {
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTask, setNewTask] = useState('')
  const [newTaskDuration, setNewTaskDuration] = useState(0)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchDailyLog()
  }, [])

  const fetchDailyLog = async () => {
    try {
      setLoading(true)
      const today = format(new Date(), 'yyyy-MM-dd')
      const response = await axios.get(`/api/daily-log?date=${today}`)
      setDailyLog(response.data.log)
      setNotes(response.data.log.notes || '')
      setError(null)
    } catch (err) {
      setError('Failed to load daily log')
      console.error('Daily log error:', err)
    } finally {
      setLoading(false)
    }
  }

  const startWorkSession = async () => {
    try {
      await axios.post(getApiUrl('/api/log'), {
        event: 'arrive',
        lat: 51.5074,
        lon: -0.1278,
        notes: 'Work session started',
        session_type: 'start'
      })
      fetchDailyLog()
    } catch (err) {
      setError('Failed to start work session')
    }
  }

  const endWorkSession = async () => {
    try {
      await axios.post(getApiUrl('/api/log'), {
        event: 'leave',
        lat: 51.5074,
        lon: -0.1278,
        notes: 'Work session ended',
        session_type: 'end'
      })
      fetchDailyLog()
    } catch (err) {
      setError('Failed to end work session')
    }
  }

  const addTask = async () => {
    if (!newTask.trim()) return

    try {
      const updatedLog = {
        ...dailyLog,
        tasks: [
          ...dailyLog!.tasks,
          {
            id: dailyLog!.tasks.length + 1,
            description: newTask,
            duration_minutes: newTaskDuration,
            timestamp: new Date().toISOString(),
            completed: false
          }
        ]
      }

      await axios.post(getApiUrl('/api/daily-log'), updatedLog)
      setNewTask('')
      setNewTaskDuration(0)
      fetchDailyLog()
    } catch (err) {
      setError('Failed to add task')
    }
  }

  const updateNotes = async () => {
    try {
      const updatedLog = {
        ...dailyLog,
        notes
      }

      await axios.post(getApiUrl('/api/daily-log'), updatedLog)
      fetchDailyLog()
    } catch (err) {
      setError('Failed to update notes')
    }
  }

  const calculateTotalHours = () => {
    if (!dailyLog?.start_time || !dailyLog?.end_time) return 0
    
    const start = new Date(dailyLog.start_time)
    const end = new Date(dailyLog.end_time)
    const totalMs = end.getTime() - start.getTime()
    const breakTime = dailyLog.breaks.reduce((acc, breakItem) => acc + breakItem.duration_minutes, 0)
    
    return Math.max(0, (totalMs / (1000 * 60 * 60)) - (breakTime / 60))
  }

  if (loading) {
    return (
      <div className="govuk-grid">
        <div className="govuk-grid-column-full">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gov-blue"></div>
            <span className="ml-4 text-gov-grey-dark">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="govuk-grid">
        <div className="govuk-notification-banner govuk-notification-banner--error">
          <div className="govuk-notification-banner__content">
            <p className="govuk-notification-banner__heading">{error}</p>
            <button onClick={fetchDailyLog} className="govuk-button mt-4">
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="govuk-grid">
      <div className="govuk-grid-column-full">
        <h1 className="text-3xl font-bold text-gov-black mb-6">
          Daily Work Logger
        </h1>

        <p className="text-lg text-gov-grey-dark mb-8">
          Track your daily work activities, tasks, and time management.
        </p>

        {dailyLog && (
          <div className="space-y-8">
            {/* Status and Timer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="govuk-card">
                <h3 className="text-lg font-semibold text-gov-black mb-2">Date</h3>
                <p className="text-xl font-bold text-gov-blue">
                  {format(new Date(dailyLog.date), 'EEEE, MMMM do, yyyy')}
                </p>
              </div>
              
              <div className="govuk-card">
                <h3 className="text-lg font-semibold text-gov-black mb-2">Status</h3>
                <p className={`text-xl font-bold ${dailyLog.status === 'online' ? 'text-gov-green' : 'text-gov-red'}`}>
                  {dailyLog.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                </p>
              </div>
              
              <div className="govuk-card">
                <h3 className="text-lg font-semibold text-gov-black mb-2">Total Hours</h3>
                <p className="text-xl font-bold text-gov-blue-light">
                  {calculateTotalHours().toFixed(2)}
                </p>
              </div>
            </div>

            {/* Work Session Controls */}
            <div className="govuk-card">
              <h3 className="text-xl font-semibold text-gov-black mb-4">Work Session</h3>
              <div className="flex space-x-4">
                <button
                  onClick={startWorkSession}
                  disabled={dailyLog.status === 'online'}
                  className="govuk-button"
                >
                  🟢 Start Work Session
                </button>
                
                <button
                  onClick={endWorkSession}
                  disabled={dailyLog.status === 'offline'}
                  className="govuk-button govuk-button--warning"
                >
                  🔴 End Work Session
                </button>
              </div>
            </div>

            {/* Task Management */}
            <div className="govuk-card">
              <br/>
              <br/>
              <h3 className="text-xl font-semibold text-gov-black mb-4">Task Management</h3>
              
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="govuk-label" htmlFor="newTask">
                      Task Description
                    </label>
                    <input
                      id="newTask"
                      type="text"
                      className="govuk-input"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      placeholder="Enter task description..."
                    />
                  </div>
                  
                  <div>
                    <label className="govuk-label" htmlFor="taskDuration">
                      Duration (minutes)
                    </label>
                    <input
                      id="taskDuration"
                      type="number"
                      min="0"
                      className="govuk-input"
                      value={newTaskDuration}
                      onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={addTask}
                      className="govuk-button"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              </div>

              {/* Tasks List */}
              {dailyLog.tasks.length > 0 ? (
                <div className="space-y-3">
                  {dailyLog.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-gray-300 rounded">
                      <div className="flex items-center space-x-3">
                        <span className={task.completed ? 'text-gov-green' : 'text-gov-grey-dark'}>
                          {task.completed ? 'Completed' : 'Pending'}
                        </span>
                        <span className={task.completed ? 'line-through text-gov-grey-dark' : 'text-gov-black'}>
                          {task.description}
                        </span>
                        {task.duration_minutes > 0 && (
                          <span className="text-sm text-gov-grey-dark">
                            ({task.duration_minutes} min)
                          </span>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        {!task.completed && (
                          <button className="text-sm text-gov-blue hover:text-gov-blue-dark">
                            Complete
                          </button>
                        )}
                        <button className="text-sm text-gov-red hover:text-red-700">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gov-grey-dark py-4">
                  No tasks added yet. Add your first task above!
                </p>
              )}
            </div>

            {/* Daily Notes */}
            <div className="govuk-card">
              <h3 className="text-xl font-semibold text-gov-black mb-4">Daily Notes</h3>
              
              <div className="mb-4">
                <label className="govuk-label" htmlFor="notes">
                  Notes (Markdown supported)
                </label>
                <textarea
                  id="notes"
                  rows={6}
                  className="govuk-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your daily notes here..."
                />
              </div>
              
              <button
                onClick={updateNotes}
                className="govuk-button"
              >
                Save Notes
              </button>
            </div>

            {/* Break Summary */}
            {dailyLog.breaks.length > 0 && (
              <div className="govuk-card">
                <h3 className="text-xl font-semibold text-gov-black mb-4">Break Summary</h3>
                <div className="overflow-x-auto">
                  <table className="govuk-table">
                    <thead>
                      <tr>
                        <th className="govuk-table__header">Time</th>
                        <th className="govuk-table__header">Type</th>
                        <th className="govuk-table__header">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyLog.breaks.map((breakItem, index) => (
                        <tr key={index}>
                          <td className="govuk-table__cell">
                            {format(new Date(breakItem.timestamp), 'HH:mm')}
                          </td>
                          <td className="govuk-table__cell">{breakItem.type}</td>
                          <td className="govuk-table__cell">{breakItem.duration_minutes} min</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
