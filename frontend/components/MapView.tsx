'use client'

import { useEffect, useRef } from 'react'

interface LogEntry {
  timestamp: string
  event: string
  lat: number
  lon: number
  notes: string
  duration_minutes: number
}

interface MapViewProps {
  logs: LogEntry[]
}

export default function MapView({ logs }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current) {
      // Simple map implementation using a placeholder
      // In a real app, you'd use Leaflet or Google Maps here
      mapRef.current.innerHTML = `
        <div style="
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #f3f2f1 0%, #e5e5e5 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          position: relative;
        ">
          <div style="
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
          ">
            <h3 style="color: #1d70b8; margin-bottom: 16px;">Location Map</h3>
            <p style="color: #6f777b; margin-bottom: 16px;">
              Interactive map showing ${logs.length} logged locations
            </p>
            <div style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-top: 16px;
            ">
              <div style="
                background: #f3f2f1;
                padding: 12px;
                border-radius: 4px;
                text-align: center;
              ">
                <div style="font-weight: bold; color: #1d70b8;">${logs.length}</div>
                <div style="font-size: 12px; color: #6f777b;">Total Logs</div>
              </div>
              <div style="
                background: #f3f2f1;
                padding: 12px;
                border-radius: 4px;
                text-align: center;
              ">
                <div style="font-weight: bold; color: #1d70b8;">${new Set(logs.map(log => log.event)).size}</div>
                <div style="font-size: 12px; color: #6f777b;">Event Types</div>
              </div>
            </div>
            <div style="
              margin-top: 16px;
              padding: 12px;
              background: #e5f3ff;
              border-radius: 4px;
              font-size: 14px;
              color: #1d70b8;
            ">
              💡 Map integration coming soon!<br/>
              For now, view your data in the Dashboard tab.
            </div>
          </div>
        </div>
      `
    }
  }, [logs])

  return <div ref={mapRef} className="w-full h-full" />
}
