'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '@/lib/config'
import { formatTimestamp, getRelativeTime } from '@/lib/utils'

interface LogEntry {
  timestamp: string
  event: string
  lat: number
  lon: number
  place: string
  notes: string
  duration_minutes: number
  mode: string
}

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
  completed_at: string | null
  priority: 'low' | 'medium' | 'high'
}

interface DashboardProps {
  data: {
    metrics: {
      total_logs: number
      today_logs: number
      unique_events: number
      total_duration_hours: number
    }
    event_distribution: Record<string, number>
    place_distribution: Record<string, number>
    task_stats: {
      total: number
      pending: number
      in_progress: number
      completed: number
    }
  }
}

export default function Dashboard({ data }: DashboardProps) {
  const { metrics, event_distribution, place_distribution, task_stats } = data
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([])
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  // Convert distributions to arrays for display
  const eventData = Object.entries(event_distribution)
  const placeData = Object.entries(place_distribution)

  // Fetch recent logs and tasks
  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        // Fetch recent logs
        const logsResponse = await axios.get(getApiUrl('/api/logs'))
        const logs = logsResponse.data.logs.slice(0, 10)
        setRecentLogs(logs)

        // Fetch recent tasks
        const tasksResponse = await axios.get(getApiUrl('/api/tasks'))
        const tasks = tasksResponse.data.tasks.slice(0, 5) // Show 5 most recent tasks
        setRecentTasks(tasks)
      } catch (error) {
        console.error('Error fetching recent data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecentData()
  }, [])

  // Function to format timestamp - using UTC to avoid timezone conversion
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { timeZone: 'UTC' }) + ' ' + 
           date.toLocaleTimeString('en-US', { 
             hour: '2-digit', 
             minute: '2-digit',
             timeZone: 'UTC'
           })
  }

  // Function to format duration
  const formatDuration = (minutes: number) => {
    if (minutes === 0) return '-'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  // Function to delete a log entry
  const deleteLog = async (timestamp: string) => {
    if (window.confirm('Are you sure you want to delete this log entry?')) {
      try {
        await axios.delete(getApiUrl(`/api/logs/${encodeURIComponent(timestamp)}`))
        // Refresh the logs
        const response = await axios.get(getApiUrl('/api/logs'))
        const logs = response.data.logs.slice(0, 10)
        setRecentLogs(logs)
      } catch (error) {
        console.error('Error deleting log:', error)
        alert('Failed to delete log entry')
      }
    }
  }

  return (
    <div>
      {/* Metrics Cards */}
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-quarter">
          <div className="govuk-card">
            <h3 className="govuk-heading-s">Total Logs</h3>
            <p className="govuk-body-l" style={{fontSize: '2rem', color: '#1d70b8', fontWeight: 'bold', marginBottom: '0'}}>{metrics.total_logs}</p>
          </div>
        </div>
        
        <div className="govuk-grid-column-one-quarter">
          <div className="govuk-card">
            <h3 className="govuk-heading-s">Today's Logs</h3>
            <p className="govuk-body-l" style={{fontSize: '2rem', color: '#00703c', fontWeight: 'bold', marginBottom: '0'}}>{metrics.today_logs}</p>
          </div>
        </div>
        
        <div className="govuk-grid-column-one-quarter">
          <div className="govuk-card">
            <h3 className="govuk-heading-s">Total Tasks</h3>
            <p className="govuk-body-l" style={{fontSize: '2rem', color: '#003078', fontWeight: 'bold', marginBottom: '0'}}>{task_stats.total}</p>
          </div>
        </div>
        
        <div className="govuk-grid-column-one-quarter">
          <div className="govuk-card">
            <h3 className="govuk-heading-s">Completed Tasks</h3>
            <p className="govuk-body-l" style={{fontSize: '2rem', color: '#00703c', fontWeight: 'bold', marginBottom: '0'}}>{task_stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-half">
          {/* Event Distribution */}
          <div className="govuk-card">
            <h3 className="govuk-heading-m">Event Distribution</h3>
            <ul className="govuk-list">
              {eventData.map(([name, value]) => (
                <li key={name} style={{marginBottom: '8px'}}>
                  <span className="govuk-tag govuk-tag--blue" style={{marginLeft: '8px'}}>{value}</span>
                  &nbsp;
                  &nbsp;
                  <span className="govuk-body">{name.replace('_', ' ')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="govuk-grid-column-one-half">
          {/* Place Distribution */}
          <div className="govuk-card">
            <h3 className="govuk-heading-m">Place Distribution</h3>
            <ul className="govuk-list">
              {placeData.map(([name, value]) => (
                <li key={name} style={{marginBottom: '8px'}}>
                  <span className="govuk-body">{name}</span>
                  <span className="govuk-tag govuk-tag--green" style={{marginLeft: '8px'}}>{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-full">
          <div className="govuk-card">
            <h3 className="govuk-heading-m">Recent Activity</h3>
            <div style={{overflowX: 'auto'}}>
              <table className="govuk-table">
                <thead>
                  <tr>
                        <th className="govuk-table__header">Date</th>
                        <th className="govuk-table__header">Event</th>
                        <th className="govuk-table__header">Place</th>
                        <th className="govuk-table__header">Mode</th>
                        <th className="govuk-table__header">Notes</th>
                        <th className="govuk-table__header">Duration</th>
                        <th className="govuk-table__header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                        <td className="govuk-table__cell" colSpan={7}>
                        <p className="govuk-body" style={{textAlign: 'center', margin: '0'}}>
                          Loading recent activity...
                        </p>
                      </td>
                    </tr>
                  ) : recentLogs.length === 0 ? (
                    <tr>
                        <td className="govuk-table__cell" colSpan={7}>
                        <p className="govuk-body" style={{textAlign: 'center', margin: '0'}}>
                          No recent activity found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    recentLogs.map((log, index) => (
                      <tr key={index}>
                        <td className="govuk-table__cell">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="govuk-table__cell">
                          <span className="govuk-tag govuk-tag--blue">
                            {log.event.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="govuk-table__cell">
                          {log.place || 'Unknown'}
                        </td>
                        <td className="govuk-table__cell">
                          <span className={`govuk-tag ${
                            log.mode === 'iPhone' ? 'govuk-tag--blue' : 'govuk-tag--grey'
                          }`}>
                            {log.mode || 'Manual'}
                          </span>
                        </td>
                        <td className="govuk-table__cell">
                          {log.notes || '-'}
                        </td>
                        <td className="govuk-table__cell">
                          {formatDuration(log.duration_minutes)}
                        </td>
                        <td className="govuk-table__cell">
                          <div style={{display: 'flex', gap: '5px'}}>
                            <button
                              onClick={() => {
                                // For now, just show an alert - you can implement edit functionality later
                                alert(`Edit log: ${log.event} at ${log.place}`)
                              }}
                              className="govuk-button govuk-button--secondary"
                              style={{padding: '4px 8px', fontSize: '12px'}}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteLog(log.timestamp)}
                              className="govuk-button govuk-button--warning"
                              style={{padding: '4px 8px', fontSize: '12px'}}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks Table */}
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-full">
          <div className="govuk-card">
            <h3 className="govuk-heading-m">Recent Tasks</h3>
            <div style={{overflowX: 'auto'}}>
              <table className="govuk-table">
                <thead>
                  <tr>
                    <th className="govuk-table__header">Title</th>
                    <th className="govuk-table__header">Status</th>
                    <th className="govuk-table__header">Priority</th>
                    <th className="govuk-table__header">Created</th>
                    <th className="govuk-table__header">Completed</th>
                    <th className="govuk-table__header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                        <td className="govuk-table__cell" colSpan={7}>
                        <p className="govuk-body" style={{textAlign: 'center', margin: '0'}}>
                          Loading recent tasks...
                        </p>
                      </td>
                    </tr>
                  ) : recentTasks.length === 0 ? (
                    <tr>
                        <td className="govuk-table__cell" colSpan={7}>
                        <p className="govuk-body" style={{textAlign: 'center', margin: '0'}}>
                          No recent tasks found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    recentTasks.map((task) => (
                      <tr key={task.id}>
                        <td className="govuk-table__cell">
                          <strong>{task.title}</strong>
                          {task.description && (
                            <p className="govuk-body-s" style={{margin: '5px 0 0 0', color: '#666'}}>
                              {task.description}
                            </p>
                          )}
                        </td>
                        <td className="govuk-table__cell">
                          <span className={`govuk-tag ${
                            task.status === 'completed' ? 'govuk-tag--green' :
                            task.status === 'in_progress' ? 'govuk-tag--blue' :
                            'govuk-tag--grey'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="govuk-table__cell">
                          <span className={`govuk-tag ${
                            task.priority === 'high' ? 'govuk-tag--red' :
                            task.priority === 'medium' ? 'govuk-tag--yellow' :
                            'govuk-tag--grey'
                          }`}>
                            {task.priority}
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
                                onClick={() => {
                                  // For now, just show an alert - you can implement complete functionality later
                                  alert(`Complete task: ${task.title}`)
                                }}
                                className="govuk-button govuk-button--primary"
                                style={{padding: '4px 8px', fontSize: '12px'}}
                              >
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => {
                                // For now, just show an alert - you can implement edit functionality later
                                alert(`Edit task: ${task.title}`)
                              }}
                              className="govuk-button govuk-button--secondary"
                              style={{padding: '4px 8px', fontSize: '12px'}}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                // For now, just show an alert - you can implement delete functionality later
                                alert(`Delete task: ${task.title}`)
                              }}
                              className="govuk-button govuk-button--warning"
                              style={{padding: '4px 8px', fontSize: '12px'}}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}