'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { getApiUrl } from '@/lib/config'
import { formatTimestamp } from '@/lib/utils'

const logSchema = z.object({
  event: z.string().min(1, 'Event is required'),
  lat: z.number().min(-90).max(90, 'Invalid latitude'),
  lon: z.number().min(-180).max(180, 'Invalid longitude'),
  place: z.string().optional(),
  notes: z.string().optional(),
  duration_minutes: z.number().min(0).optional(),
})

type LogFormData = z.infer<typeof logSchema>

const eventTypes = [
  { value: 'arrive', label: 'Arrive' },
  { value: 'exit', label: 'Exit' },
  { value: 'new_task', label: 'New Task' },
  { value: 'task_complete', label: 'Task Complete' },
  { value: 'break_start', label: 'Break Start' },
  { value: 'break_end', label: 'Break End' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
]

interface Place {
  id: string
  name: string
  lat: number
  lon: number
  geofence_radius: number
  type: string
}

export default function LogPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [places, setPlaces] = useState<Place[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState(true)
  const [lastArriveTime, setLastArriveTime] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)
  const [confirmData, setConfirmData] = useState<{
    eventType: 'arrive' | 'exit'
    lat: number
    lon: number
    detectedPlace: Place | null
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      event: 'arrive',
      lat: 51.5074,
      lon: -0.1278,
      place: '',
      notes: '',
      duration_minutes: 0,
    }
  })

  const watchedEvent = watch('event')
  const watchedLat = watch('lat')
  const watchedLon = watch('lon')

  // Fetch places and last arrive time on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch places
        const placesResponse = await axios.get(getApiUrl('/api/places'))
        setPlaces(placesResponse.data.places)
        
        // Fetch last arrive time
        const logsResponse = await axios.get(getApiUrl('/api/logs'))
        const logs = logsResponse.data.logs
        
        // Find the most recent 'arrive' event
        const lastArrive = logs
          .filter((log: any) => log.event === 'arrive')
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
        
        if (lastArrive) {
          setLastArriveTime(lastArrive.timestamp)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoadingPlaces(false)
      }
    }
    fetchData()
  }, [])

  // Function to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  // Function to find matching place based on geofence
  const findMatchingPlace = (lat: number, lon: number) => {
    for (const place of places) {
      const distance = calculateDistance(lat, lon, place.lat, place.lon)
      if (distance <= place.geofence_radius) {
        return place
      }
    }
    return null
  }

  // Auto-detect place when coordinates change
  useEffect(() => {
    if (watchedLat && watchedLon && places.length > 0) {
      const matchingPlace = findMatchingPlace(watchedLat, watchedLon)
      if (matchingPlace) {
        setValue('place', matchingPlace.id)
      } else {
        setValue('place', '')
      }
    }
  }, [watchedLat, watchedLon, places, setValue])

  // Function to calculate duration between arrive and exit
  const calculateDuration = (arriveTime: string, exitTime: string) => {
    const arrive = new Date(arriveTime)
    const exit = new Date(exitTime)
    const diffMs = exit.getTime() - arrive.getTime()
    return Math.round(diffMs / (1000 * 60)) // Convert to minutes
  }

  // Reset duration for non-exit events (backend will calculate for exit events)
  useEffect(() => {
    if (watchedEvent !== 'exit') {
      setValue('duration_minutes', 0)
    }
  }, [watchedEvent, setValue])

  const fetchLastArriveTime = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/logs?event=arrive&limit=1'))
      if (response.data.logs && response.data.logs.length > 0) {
        setLastArriveTime(response.data.logs[0].timestamp)
      }
    } catch (error) {
      console.error('Error fetching last arrive time:', error)
    }
  }

  const onSubmit = async (data: LogFormData) => {
    setIsSubmitting(true)

    try {
      const payload = {
        ...data,
        session_type: data.event === 'arrive' ? 'start' : data.event === 'exit' ? 'end' : undefined
      }

      const response = await axios.post(getApiUrl('/api/log'), payload)
      
      showToast('success', response.data.message)
      
      reset()
      // Refresh last arrive time for duration calculation
      if (data.event === 'arrive') {
        fetchLastArriveTime()
      }
    } catch (error: any) {
      showToast('error', error.response?.data?.error || 'Failed to log event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('lat', position.coords.latitude)
          setValue('lon', position.coords.longitude)
          // Place will be auto-detected by the useEffect
          showToast('success', 'Current location obtained successfully')
        },
        (error) => {
          showToast('error', 'Failed to get current location')
        }
      )
    } else {
      showToast('error', 'Geolocation is not supported by this browser')
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const quickLogEvent = async (eventType: 'arrive' | 'exit') => {
    // Get current location first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          
          // Find matching place based on geofence
          const detectedPlace = findMatchingPlace(lat, lon)
          
          // Show custom confirmation popup
          setConfirmData({
            eventType,
            lat,
            lon,
            detectedPlace
          })
          setShowConfirmPopup(true)
        },
        (error) => {
          showToast('error', `Error getting location: ${error.message}`)
        }
      )
    } else {
      showToast('error', 'Geolocation is not supported by this browser')
    }
  }

  const confirmLogEvent = async (selectedPlace?: Place) => {
    if (!confirmData) return

    try {
      setIsSubmitting(true)
      
      const place = selectedPlace || confirmData.detectedPlace
      const logData = {
        event: confirmData.eventType,
        lat: confirmData.lat,
        lon: confirmData.lon,
        place: place?.name || '',
        notes: confirmData.eventType === 'arrive' ? 'Work session started' : 'Work session ended',
        duration_minutes: 0,
        session_type: confirmData.eventType === 'arrive' ? 'start' : 'end'
      }

      const response = await axios.post(getApiUrl('/api/log'), logData)
      
      if (response.data.success) {
        showToast('success', `${confirmData.eventType.charAt(0).toUpperCase() + confirmData.eventType.slice(1)} event logged successfully`)
        reset()
        // Refresh last arrive time for duration calculation
        if (confirmData.eventType === 'arrive') {
          fetchLastArriveTime()
        }
      } else {
        showToast('error', response.data.error || 'Failed to log event')
      }
    } catch (error) {
      console.error('Error logging event:', error)
      showToast('error', 'Failed to log event')
    } finally {
      setIsSubmitting(false)
      setShowConfirmPopup(false)
      setConfirmData(null)
    }
  }

  return (
    <div className="govuk-main-wrapper">
      <h1 className="govuk-heading-xl">
        <br/>
        Log Work Event
      </h1>

      <p className="govuk-body-l">
        Record your work activities and location data. Events are automatically assigned to places based on your location.
      </p>

      {/* Toast Notification */}
      {toast && (
        <div 
          className={`govuk-notification-banner govuk-notification-banner--${toast.type}`}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            maxWidth: '400px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="govuk-notification-banner__content">
            <p className="govuk-notification-banner__heading">
              {toast.message}
            </p>
          </div>
        </div>
      )}

      <div className="govuk-grid-row">
        {/* Left Column - Quick Actions */}
        <div className="govuk-grid-column-one-half">
          <div className="govuk-card">
            <h3 className="govuk-heading-m">Quick Actions</h3>
            <p className="govuk-body">One-click logging for common work events.</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <button
                onClick={() => quickLogEvent('arrive')}
                disabled={isSubmitting}
                className="govuk-button govuk-button--primary"
                style={{width: '100%'}}
              >
                Arrive at Work
              </button>
              <button
                onClick={() => quickLogEvent('exit')}
                disabled={isSubmitting}
                className="govuk-button govuk-button--secondary"
                style={{width: '100%'}}
              >
                Exit Work
              </button>
            </div>
          </div>

          {/* Current Location Info */}
          <div className="govuk-card">
            <h3 className="govuk-heading-m">Current Location</h3>
            <p className="govuk-body">
              <strong>Latitude:</strong> {watchedLat}<br/>
              <strong>Longitude:</strong> {watchedLon}
            </p>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="govuk-button govuk-button--secondary"
              style={{width: '100%'}}
            >
              Use Current Location
            </button>
          </div>
        </div>

        {/* Right Column - Manual Form */}
        <div className="govuk-grid-column-one-half">
          <div className="govuk-card">
            <h3 className="govuk-heading-m">Manual Entry</h3>
            <p className="govuk-body">Enter custom event details manually.</p>
            
            <form onSubmit={handleSubmit(onSubmit)}>
            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="event">
                Event Type
              </label>
              <select
                id="event"
                className="govuk-select"
                {...register('event')}
              >
                {eventTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.event && (
                <p className="govuk-error-message">{errors.event.message}</p>
              )}
            </div>

            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="place">
                Place (auto-detected or manual selection)
              </label>
              <select
                id="place"
                className="govuk-select"
                {...register('place')}
              >
                <option value="">Select a place (or leave empty for auto-detection)</option>
                {places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name} ({place.type}) - {place.geofence_radius}m radius
                  </option>
                ))}
              </select>
              {watchedLat && watchedLon && places.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  {(() => {
                    const matchingPlace = findMatchingPlace(watchedLat, watchedLon)
                    if (matchingPlace) {
                      return (
                        <div className="govuk-notification-banner govuk-notification-banner--success">
                          <div className="govuk-notification-banner__content">
                            <p className="govuk-notification-banner__heading">
                              Auto-detected: {matchingPlace.name} (within {matchingPlace.geofence_radius}m radius)
                            </p>
                          </div>
                        </div>
                      )
                    } else {
                      return (
                        <div className="govuk-notification-banner govuk-notification-banner--warning">
                          <div className="govuk-notification-banner__content">
                            <p className="govuk-notification-banner__heading">
                              No place detected within geofence. You can manually select a place above.
                            </p>
                          </div>
                        </div>
                      )
                    }
                  })()}
                </div>
              )}
            </div>

            <div className="govuk-grid-row">
              <div className="govuk-grid-column-one-half">
                <div className="govuk-form-group">
                  <label className="govuk-label" htmlFor="lat">
                    Latitude
                  </label>
                  <input
                    id="lat"
                    type="number"
                    step="any"
                    className="govuk-input"
                    {...register('lat', { valueAsNumber: true })}
                  />
                  {errors.lat && (
                    <p className="govuk-error-message">{errors.lat.message}</p>
                  )}
                </div>
              </div>
              <div className="govuk-grid-column-one-half">
                <div className="govuk-form-group">
                  <label className="govuk-label" htmlFor="lon">
                    Longitude
                  </label>
                  <input
                    id="lon"
                    type="number"
                    step="any"
                    className="govuk-input"
                    {...register('lon', { valueAsNumber: true })}
                  />
                  {errors.lon && (
                    <p className="govuk-error-message">{errors.lon.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="notes">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                className="govuk-textarea"
                rows={4}
                placeholder="Add any additional notes about this event..."
                {...register('notes')}
              />
            </div>

            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="duration_minutes">
                Duration (minutes - Optional)
              </label>
              <input
                id="duration_minutes"
                type="number"
                min="0"
                className="govuk-input"
                {...register('duration_minutes', { valueAsNumber: true })}
              />
              <p className="govuk-hint">
                {watchedEvent === 'exit' 
                  ? 'Duration will be automatically calculated from your last arrive event'
                  : 'Leave as 0 for instant events (arrive, new_task, etc.)'
                }
              </p>
            </div>

            <div className="govuk-form-group">
              <div style={{display: 'flex', gap: '10px'}}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="govuk-button govuk-button--primary"
                  style={{flex: 1}}
                >
                  {isSubmitting ? 'Logging...' : 'Log Event'}
                </button>
                <button
                  type="button"
                  onClick={() => reset()}
                  className="govuk-button govuk-button--secondary"
                  style={{flex: 1}}
                >
                  Clear Form
                </button>
              </div>
            </div>
            </form>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Popup */}
      {showConfirmPopup && confirmData && (
        <div 
          className="govuk-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="govuk-modal-dialog"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #b1b4b6',
              borderRadius: '4px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div style={{padding: '30px'}}>
              <div className="govuk-grid-row">
                <div className="govuk-grid-column-full">
                  <h1 className="govuk-heading-l" style={{marginTop: 0, marginBottom: '20px'}}>
                    Confirm {confirmData.eventType === 'arrive' ? 'Arrival' : 'Exit'}
                  </h1>
                  
                  <div className="govuk-body">
                    <p className="govuk-body-m">
                      <strong>Location coordinates:</strong><br/>
                      Latitude: {confirmData.lat.toFixed(6)}<br/>
                      Longitude: {confirmData.lon.toFixed(6)}
                    </p>
                    
                    {confirmData.detectedPlace ? (
                      <div className="govuk-inset-text" style={{marginTop: '20px'}}>
                        <p className="govuk-body-m">
                          <strong>Your location falls in {confirmData.detectedPlace.name}'s geofence</strong>
                        </p>
                        <p className="govuk-body-s">
                          Geofence radius: {confirmData.detectedPlace.geofence_radius} metres
                        </p>
                      </div>
                    ) : (
                      <div className="govuk-warning-text" style={{marginTop: '20px'}}>
                        <span className="govuk-warning-text__icon" aria-hidden="true">!</span>
                        <strong className="govuk-warning-text__text">
                          <span className="govuk-warning-text__assistive">Warning</span>
                          No matching place found for this location
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="govuk-form-group" style={{marginTop: '30px'}}>
                    <label className="govuk-label govuk-label--m" htmlFor="place-select">
                      Select location
                    </label>
                    <div className="govuk-hint">
                      Choose the place where this event occurred
                    </div>
                    <select 
                      id="place-select"
                      className="govuk-select"
                      defaultValue={confirmData.detectedPlace?.name || ''}
                    >
                      <option value="">Choose a place...</option>
                      {places.map((place) => (
                        <option key={place.name} value={place.name}>
                          {place.name} ({place.lat.toFixed(4)}, {place.lon.toFixed(4)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="govuk-button-group" style={{marginTop: '40px'}}>
                    <button
                      onClick={() => {
                        const select = document.getElementById('place-select') as HTMLSelectElement
                        const selectedPlaceName = select.value
                        const selectedPlace = places.find(p => p.name === selectedPlaceName)
                        confirmLogEvent(selectedPlace)
                      }}
                      className="govuk-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Logging...' : 'Continue'}
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmPopup(false)
                        setConfirmData(null)
                      }}
                      className="govuk-button govuk-button--secondary"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}