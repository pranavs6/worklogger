'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '@/lib/config'
import dynamic from 'next/dynamic'

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gov-grey flex items-center justify-center">Loading map...</div>
})

interface LogEntry {
  timestamp: string
  event: string
  lat: number
  lon: number
  notes: string
  duration_minutes: number
}

export default function MapPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await axios.get(getApiUrl('/api/logs'))
      setLogs(response.data.logs)
      setError(null)
    } catch (err) {
      setError('Failed to load location data')
      console.error('Map error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="govuk-grid">
        <div className="govuk-grid-column-full">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gov-blue"></div>
            <span className="ml-4 text-gov-grey-dark">Loading map...</span>
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
            <button onClick={fetchLogs} className="govuk-button mt-4">
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
          Location Map
        </h1>

        <p className="text-lg text-gov-grey-dark mb-8">
          View all your logged locations on an interactive map.
        </p>

        <div className="govuk-card">
          <div className="h-96 w-full">
            <MapComponent logs={logs} />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gov-black mb-4">Location Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="govuk-card">
              <h4 className="font-semibold text-gov-black">Total Locations</h4>
              <p className="text-2xl font-bold text-gov-blue">{logs.length}</p>
            </div>
            <div className="govuk-card">
              <h4 className="font-semibold text-gov-black">Unique Locations</h4>
              <p className="text-2xl font-bold text-gov-green">
                {new Set(logs.map(log => `${log.lat},${log.lon}`)).size}
              </p>
            </div>
            <div className="govuk-card">
              <h4 className="font-semibold text-gov-black">Event Types</h4>
              <p className="text-2xl font-bold text-gov-blue-light">
                {new Set(logs.map(log => log.event)).size}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
