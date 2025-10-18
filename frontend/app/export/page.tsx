'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '@/lib/config'
import { format } from 'date-fns'

interface LogEntry {
  timestamp: string
  event: string
  lat: number
  lon: number
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

export default function ExportPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [exportType, setExportType] = useState<'logs' | 'tasks' | 'both'>('logs')
  const [dateFilter, setDateFilter] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch logs
      const logsParams = new URLSearchParams()
      if (dateFilter) logsParams.append('date', dateFilter)
      if (eventFilter) logsParams.append('event', eventFilter)
      
      const logsResponse = await axios.get(getApiUrl(`/api/logs?${logsParams.toString()}`))
      setLogs(logsResponse.data.logs)
      
      // Fetch tasks
      const tasksParams = new URLSearchParams()
      if (statusFilter) tasksParams.append('status', statusFilter)
      
      const tasksResponse = await axios.get(getApiUrl(`/api/tasks?${tasksParams.toString()}`))
      setTasks(tasksResponse.data.tasks)
      
      setError(null)
    } catch (err) {
      setError('Failed to load data')
      console.error('Export error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss')
      
      if (exportType === 'logs') {
        if (exportFormat === 'csv') {
          // Use backend export endpoint for CSV
          const response = await axios.get(getApiUrl('/api/export?type=logs'), {
            responseType: 'blob'
          })
          
          const url = window.URL.createObjectURL(new Blob([response.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `work_logs_${timestamp}.csv`)
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(url)
        } else {
          // Use frontend JSON export for logs
          const jsonData = JSON.stringify(logs, null, 2)
          const blob = new Blob([jsonData], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `work_logs_${timestamp}.json`)
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(url)
        }
      } else if (exportType === 'tasks') {
        if (exportFormat === 'csv') {
          // Use backend export endpoint for CSV
          const response = await axios.get(getApiUrl('/api/export?type=tasks'), {
            responseType: 'blob'
          })
          
          const url = window.URL.createObjectURL(new Blob([response.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `work_tasks_${timestamp}.csv`)
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(url)
        } else {
          // Use frontend JSON export for tasks
          const jsonData = JSON.stringify(tasks, null, 2)
          const blob = new Blob([jsonData], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `work_tasks_${timestamp}.json`)
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(url)
        }
      } else if (exportType === 'both') {
        // Export both logs and tasks using backend combined export
        const response = await axios.get(getApiUrl('/api/export?type=combined'), {
          responseType: 'blob'
        })
        
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `work_data_${timestamp}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      setError('Failed to export data')
      console.error('Export error:', err)
    }
  }

  const convertTasksToCSV = (tasks: Task[]) => {
    const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Created At', 'Completed At']
    const rows = tasks.map(task => [
      task.id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.created_at,
      task.completed_at || ''
    ])
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  }

  const getUniqueEvents = () => {
    return Array.from(new Set(logs.map(log => log.event)))
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
            <button onClick={fetchData} className="govuk-button mt-4">
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
          <br/>
          Export Data
        </h1>

        <p className="text-lg text-gov-grey-dark mb-8">
          Export your work logs in various formats for analysis and reporting.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Export Controls */}
          <div className="lg:col-span-1">
            <div className="govuk-card">
              <h3 className="text-xl font-semibold text-gov-black mb-4">Export Options</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="govuk-label" htmlFor="exportType">
                    Export Type
                  </label>
                  <select
                    id="exportType"
                    className="govuk-select"
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value as 'logs' | 'tasks' | 'both')}
                  >
                    <option value="logs">Work Logs Only</option>
                    <option value="tasks">Tasks Only</option>
                    <option value="both">Both Logs & Tasks</option>
                  </select>
                </div>

                <div>
                  <label className="govuk-label" htmlFor="format">
                    Export Format
                  </label>
                  <select
                    id="format"
                    className="govuk-select"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                    disabled={exportType === 'both'}
                  >
                    <option value="csv">CSV (Spreadsheet)</option>
                    <option value="json">JSON (Data)</option>
                  </select>
                  {exportType === 'both' && (
                    <p className="govuk-hint">Combined export is only available in CSV format</p>
                  )}
                </div>

                <div>
                  <label className="govuk-label" htmlFor="dateFilter">
                    Filter by Date (optional)
                  </label>
                  <input
                    id="dateFilter"
                    type="date"
                    className="govuk-input"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>

                {(exportType === 'logs' || exportType === 'both') && (
                  <div>
                    <label className="govuk-label" htmlFor="eventFilter">
                      Filter by Event (optional)
                    </label>
                    <select
                      id="eventFilter"
                      className="govuk-select"
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value)}
                    >
                      <option value="">All Events</option>
                      {getUniqueEvents().map(event => (
                        <option key={event} value={event}>
                          {event.charAt(0).toUpperCase() + event.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(exportType === 'tasks' || exportType === 'both') && (
                  <div>
                    <label className="govuk-label" htmlFor="statusFilter">
                      Filter by Status (optional)
                    </label>
                    <select
                      id="statusFilter"
                      className="govuk-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleExport}
                    className="govuk-button w-full"
                  >
                    📥 Download Export
                  </button>
                  
                  <button
                    onClick={fetchData}
                    className="govuk-button govuk-button--secondary w-full"
                  >
                    🔄 Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Data Preview */}
          <div className="lg:col-span-2">
            <div className="govuk-card">
              <h3 className="text-xl font-semibold text-gov-black mb-4">
                Data Preview ({exportType === 'logs' ? logs.length : exportType === 'tasks' ? tasks.length : logs.length + tasks.length} records)
              </h3>
              
              <div className="overflow-x-auto">
                {exportType === 'logs' ? (
                  <table className="govuk-table">
                    <thead>
                      <tr>
                        <th className="govuk-table__header">Date</th>
                        <th className="govuk-table__header">Event</th>
                        <th className="govuk-table__header">Location</th>
                        <th className="govuk-table__header">Mode</th>
                        <th className="govuk-table__header">Notes</th>
                        <th className="govuk-table__header">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, 10).map((log, index) => (
                        <tr key={index}>
                          <td className="govuk-table__cell">
                            {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                          </td>
                          <td className="govuk-table__cell">
                            <span className="px-2 py-1 bg-gov-blue text-white text-xs rounded">
                              {log.event.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="govuk-table__cell text-sm">
                            {log.lat.toFixed(4)}, {log.lon.toFixed(4)}
                          </td>
                          <td className="govuk-table__cell">
                            <span className={`px-2 py-1 text-white text-xs rounded ${
                              log.mode === 'iPhone' ? 'bg-blue-600' : 'bg-grey-600'
                            }`}>
                              {log.mode || 'Manual'}
                            </span>
                          </td>
                          <td className="govuk-table__cell text-sm">
                            {log.notes || '-'}
                          </td>
                          <td className="govuk-table__cell">
                            {log.duration_minutes > 0 ? `${log.duration_minutes}m` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : exportType === 'tasks' ? (
                  <table className="govuk-table">
                    <thead>
                      <tr>
                        <th className="govuk-table__header">Title</th>
                        <th className="govuk-table__header">Status</th>
                        <th className="govuk-table__header">Priority</th>
                        <th className="govuk-table__header">Created</th>
                        <th className="govuk-table__header">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.slice(0, 10).map((task, index) => (
                        <tr key={index}>
                          <td className="govuk-table__cell">
                            <strong>{task.title}</strong>
                            {task.description && (
                              <p className="text-sm text-gov-grey-dark mt-1">
                                {task.description}
                              </p>
                            )}
                          </td>
                          <td className="govuk-table__cell">
                            <span className={`px-2 py-1 text-white text-xs rounded ${
                              task.status === 'completed' ? 'bg-green-600' :
                              task.status === 'in_progress' ? 'bg-blue-600' :
                              'bg-grey-600'
                            }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="govuk-table__cell">
                            <span className={`px-2 py-1 text-white text-xs rounded ${
                              task.priority === 'high' ? 'bg-red-600' :
                              task.priority === 'medium' ? 'bg-yellow-600' :
                              'bg-grey-600'
                            }`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="govuk-table__cell text-sm">
                            {format(new Date(task.created_at), 'MMM dd, yyyy')}
                          </td>
                          <td className="govuk-table__cell text-sm">
                            {task.completed_at ? format(new Date(task.completed_at), 'MMM dd, yyyy') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  // Both logs and tasks - show combined view
                  <div>
                    {/* Logs Section */}
                    <div className="mb-6">
                      <h4 className="govuk-heading-s mb-3">Work Logs ({logs.length} records)</h4>
                      <table className="govuk-table">
                        <thead>
                          <tr>
                            <th className="govuk-table__header">Date</th>
                            <th className="govuk-table__header">Event</th>
                            <th className="govuk-table__header">Location</th>
                            <th className="govuk-table__header">Mode</th>
                            <th className="govuk-table__header">Notes</th>
                            <th className="govuk-table__header">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.slice(0, 5).map((log, index) => (
                            <tr key={`log-${index}`}>
                              <td className="govuk-table__cell">
                                {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                              </td>
                              <td className="govuk-table__cell">
                                <span className="px-2 py-1 bg-gov-blue text-white text-xs rounded">
                                  {log.event.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="govuk-table__cell text-sm">
                                {log.lat.toFixed(4)}, {log.lon.toFixed(4)}
                              </td>
                              <td className="govuk-table__cell">
                                <span className={`px-2 py-1 text-white text-xs rounded ${
                                  log.mode === 'iPhone' ? 'bg-blue-600' : 'bg-grey-600'
                                }`}>
                                  {log.mode || 'Manual'}
                                </span>
                              </td>
                              <td className="govuk-table__cell text-sm">
                                {log.notes || '-'}
                              </td>
                              <td className="govuk-table__cell">
                                {log.duration_minutes > 0 ? `${log.duration_minutes}m` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {logs.length > 5 && (
                        <p className="text-sm text-gov-grey-dark mt-2">
                          Showing first 5 of {logs.length} log records
                        </p>
                      )}
                    </div>

                    {/* Tasks Section */}
                    <div>
                      <h4 className="govuk-heading-s mb-3">Tasks ({tasks.length} records)</h4>
                      <table className="govuk-table">
                        <thead>
                          <tr>
                            <th className="govuk-table__header">Title</th>
                            <th className="govuk-table__header">Status</th>
                            <th className="govuk-table__header">Priority</th>
                            <th className="govuk-table__header">Created</th>
                            <th className="govuk-table__header">Completed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.slice(0, 5).map((task, index) => (
                            <tr key={`task-${index}`}>
                              <td className="govuk-table__cell">
                                <strong>{task.title}</strong>
                                {task.description && (
                                  <p className="text-sm text-gov-grey-dark mt-1">
                                    {task.description}
                                  </p>
                                )}
                              </td>
                              <td className="govuk-table__cell">
                                <span className={`px-2 py-1 text-white text-xs rounded ${
                                  task.status === 'completed' ? 'bg-green-600' :
                                  task.status === 'in_progress' ? 'bg-blue-600' :
                                  'bg-grey-600'
                                }`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="govuk-table__cell">
                                <span className={`px-2 py-1 text-white text-xs rounded ${
                                  task.priority === 'high' ? 'bg-red-600' :
                                  task.priority === 'medium' ? 'bg-yellow-600' :
                                  'bg-grey-600'
                                }`}>
                                  {task.priority}
                                </span>
                              </td>
                              <td className="govuk-table__cell text-sm">
                                {format(new Date(task.created_at), 'MMM dd, yyyy')}
                              </td>
                              <td className="govuk-table__cell text-sm">
                                {task.completed_at ? format(new Date(task.completed_at), 'MMM dd, yyyy') : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {tasks.length > 5 && (
                        <p className="text-sm text-gov-grey-dark mt-2">
                          Showing first 5 of {tasks.length} task records
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {exportType === 'logs' && logs.length > 10 && (
                <p className="text-center text-gov-grey-dark mt-4">
                  Showing first 10 of {logs.length} log records
                </p>
              )}
              {exportType === 'tasks' && tasks.length > 10 && (
                <p className="text-center text-gov-grey-dark mt-4">
                  Showing first 10 of {tasks.length} task records
                </p>
              )}
            </div>

            {/* Export Summary */}
            <div className="govuk-card mt-6">
              <h3 className="text-xl font-semibold text-gov-black mb-4">Export Summary</h3>
              
              {exportType === 'logs' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gov-blue">{logs.length}</div>
                    <div className="text-sm text-gov-grey-dark">Total Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gov-green">
                      {new Set(logs.map(log => log.event)).size}
                    </div>
                    <div className="text-sm text-gov-grey-dark">Event Types</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gov-blue-light">
                      {new Set(logs.map(log => `${log.lat.toFixed(4)},${log.lon.toFixed(4)}`)).size}
                    </div>
                    <div className="text-sm text-gov-grey-dark">Unique Locations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gov-blue-dark">
                      {Math.round(logs.reduce((acc, log) => acc + log.duration_minutes, 0) / 60 * 10) / 10}
                    </div>
                    <div className="text-sm text-gov-grey-dark">Total Hours</div>
                  </div>
                </div>
              ) : exportType === 'tasks' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gov-blue">{tasks.length}</div>
                    <div className="text-sm text-gov-grey-dark">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gov-green">
                      {tasks.filter(task => task.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gov-grey-dark">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gov-blue-light">
                      {tasks.filter(task => task.status === 'in_progress').length}
                    </div>
                    <div className="text-sm text-gov-grey-dark">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gov-blue-dark">
                      {tasks.filter(task => task.status === 'pending').length}
                    </div>
                    <div className="text-sm text-gov-grey-dark">Pending</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gov-blue">{logs.length + tasks.length}</div>
                    <div className="text-sm text-gov-grey-dark">Total Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gov-green">{logs.length}</div>
                    <div className="text-sm text-gov-grey-dark">Work Logs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gov-blue-light">{tasks.length}</div>
                    <div className="text-sm text-gov-grey-dark">Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gov-blue-dark">
                      {Math.round(logs.reduce((acc, log) => acc + log.duration_minutes, 0) / 60 * 10) / 10}
                    </div>
                    <div className="text-sm text-gov-grey-dark">Total Hours</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
