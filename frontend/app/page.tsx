'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Dashboard from '@/components/Dashboard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { getApiUrl } from '@/lib/config'

interface DashboardData {
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

export default function HomePage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await axios.get(getApiUrl('/api/dashboard'))
      setDashboardData(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="govuk-grid">
        <div className="govuk-notification-banner govuk-notification-banner--error">
          <div className="govuk-notification-banner__header">
            <h2 className="govuk-notification-banner__title">Error</h2>
          </div>
          <div className="govuk-notification-banner__content">
            <p className="govuk-notification-banner__heading">
              {error}
            </p>
            <button 
              onClick={fetchDashboardData}
              className="govuk-button mt-4"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="govuk-main-wrapper">
      <br/>
      <h1 className="govuk-heading-xl">
        Work Logging Dashboard
      </h1>

      <p className="govuk-body-l">
        Track your work activities, locations, and time management with our professional logging system.
      </p>

      {dashboardData && <Dashboard data={dashboardData} />}
    </div>
  )
}
