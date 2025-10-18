'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'

interface Event {
  id: string
  title: string
  description: string
  date: string
  tags?: string[]
  mood?: string
  location?: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedMood, setSelectedMood] = useState('')
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    tags: '',
    mood: '',
    location: ''
  })

  // Load events from API
  useEffect(() => {
    fetchEvents()
  }, [])

  // Filter events based on filters
  const filteredEvents = events.filter(event => {
    if (selectedDate && event.date !== selectedDate) return false
    if (selectedMood && event.mood !== selectedMood) return false
    return true
  })

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const eventData = {
        ...newEvent,
        tags: newEvent.tags ? newEvent.tags.split(',').map(tag => tag.trim()) : [],
        id: `event_${Date.now()}`
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        setEvents([eventData, ...events])
        setNewEvent({
          title: '',
          description: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          tags: '',
          mood: '',
          location: ''
        })
        setIsAddingEvent(false)
      }
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`/api/events/${eventId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setEvents(events.filter(event => event.id !== eventId))
        }
      } catch (error) {
        console.error('Error deleting event:', error)
      }
    }
  }

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: { [key: string]: string } = {
      'happy': '😊',
      'sad': '😢',
      'angry': '😠',
      'excited': '🤩',
      'tired': '😴',
      'frustrated': '😤',
      'content': '😌',
      'anxious': '😰',
      'motivated': '💪',
      'neutral': '😐'
    }
    return moodEmojis[mood] || '📝'
  }

  const getMoodColor = (mood: string) => {
    const moodColors: { [key: string]: string } = {
      'happy': 'govuk-tag--green',
      'sad': 'govuk-tag--grey',
      'angry': 'govuk-tag--red',
      'excited': 'govuk-tag--blue',
      'tired': 'govuk-tag--grey',
      'frustrated': 'govuk-tag--red',
      'content': 'govuk-tag--green',
      'anxious': 'govuk-tag--grey',
      'motivated': 'govuk-tag--blue',
      'neutral': 'govuk-tag--grey'
    }
    return moodColors[mood] || 'govuk-tag--grey'
  }

  return (
    <div className="govuk-main-wrapper">
      <div className="govuk-grid">
        <div className="govuk-grid-column-full">
          <h1 className="govuk-heading-xl">Work Journal</h1>
          <p className="govuk-body-l">
            Record your thoughts, experiences, and reflections about your work day.
          </p>
        </div>
      </div>

      {/* Side-by-side layout */}
      <div className="govuk-grid-row" style={{ marginTop: '30px' }}>
        {/* Left side - Form */}
        <div className="govuk-grid-column-one-half">
          <div className="govuk-card">
            <h2 className="govuk-heading-m">Add New Journal Entry</h2>
            <form onSubmit={handleAddEvent}>
              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="title">
                  Title
                </label>
                <input
                  className="govuk-input"
                  id="title"
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  required
                />
              </div>

              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="date">
                  Date
                </label>
                <input
                  className="govuk-input"
                  id="date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  required
                />
              </div>

              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  className="govuk-textarea"
                  id="description"
                  rows={6}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="What happened today? How did you feel? Any important thoughts or reflections..."
                  required
                />
              </div>

              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="mood">
                  Mood
                </label>
                <select
                  className="govuk-select"
                  id="mood"
                  value={newEvent.mood}
                  onChange={(e) => setNewEvent({...newEvent, mood: e.target.value})}
                >
                  <option value="">Select mood</option>
                  <option value="happy">😊 Happy</option>
                  <option value="sad">😢 Sad</option>
                  <option value="angry">😠 Angry</option>
                  <option value="excited">🤩 Excited</option>
                  <option value="tired">😴 Tired</option>
                  <option value="frustrated">😤 Frustrated</option>
                  <option value="content">😌 Content</option>
                  <option value="anxious">😰 Anxious</option>
                  <option value="motivated">💪 Motivated</option>
                  <option value="neutral">😐 Neutral</option>
                </select>
              </div>

              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="location">
                  Location
                </label>
                <input
                  className="govuk-input"
                  id="location"
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  placeholder="Office, Home, Client site..."
                />
              </div>

              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="tags">
                  Tags
                </label>
                <input
                  className="govuk-input"
                  id="tags"
                  type="text"
                  value={newEvent.tags}
                  onChange={(e) => setNewEvent({...newEvent, tags: e.target.value})}
                  placeholder="meeting, project, team (comma separated)"
                />
              </div>

              <div className="govuk-form-group">
                <button type="submit" className="govuk-button">
                  Save Entry
                </button>
                <button
                  type="button"
                  className="govuk-button govuk-button--secondary"
                  onClick={() => {
                    setNewEvent({
                      title: '',
                      description: '',
                      date: format(new Date(), 'yyyy-MM-dd'),
                      tags: '',
                      mood: '',
                      location: ''
                    })
                  }}
                  style={{ marginLeft: '10px' }}
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right side - Events List */}
        <div className="govuk-grid-column-one-half">
          <div className="govuk-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="govuk-heading-m" style={{ margin: 0 }}>
                Journal Entries ({filteredEvents.length})
              </h2>
              
              {/* Filters */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  className="govuk-select"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ width: '120px' }}
                >
                  <option value="">All dates</option>
                  {Array.from(new Set(events.map(e => e.date))).sort().reverse().map(date => (
                    <option key={date} value={date}>
                      {format(parseISO(date), 'MMM dd')}
                    </option>
                  ))}
                </select>
                
                <select
                  className="govuk-select"
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  style={{ width: '120px' }}
                >
                  <option value="">All moods</option>
                  <option value="happy">😊 Happy</option>
                  <option value="sad">😢 Sad</option>
                  <option value="angry">😠 Angry</option>
                  <option value="excited">🤩 Excited</option>
                  <option value="tired">😴 Tired</option>
                  <option value="frustrated">😤 Frustrated</option>
                  <option value="content">😌 Content</option>
                  <option value="anxious">😰 Anxious</option>
                  <option value="motivated">💪 Motivated</option>
                  <option value="neutral">😐 Neutral</option>
                </select>
              </div>
            </div>
            
            {filteredEvents.length === 0 ? (
              <p className="govuk-body">
                {events.length === 0 
                  ? "No journal entries yet. Add your first entry to get started!"
                  : "No entries match your current filters."
                }
              </p>
            ) : (
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {filteredEvents.map((event) => (
                  <div key={event.id} className="govuk-card" style={{ marginBottom: '15px', padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 className="govuk-heading-s" style={{ marginBottom: '8px' }}>
                          {event.title}
                        </h3>
                        <p className="govuk-body-s" style={{ color: '#626a6e', marginBottom: '8px' }}>
                          {format(parseISO(event.date), 'MMM dd, yyyy')}
                        </p>
                        <p className="govuk-body" style={{ marginBottom: '10px', fontSize: '14px' }}>
                          {event.description.length > 150 
                            ? `${event.description.substring(0, 150)}...` 
                            : event.description
                          }
                        </p>
                        
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {event.mood && (
                            <span className={`govuk-tag ${getMoodColor(event.mood)}`} style={{ fontSize: '12px' }}>
                              {getMoodEmoji(event.mood)} {event.mood}
                            </span>
                          )}
                          {event.location && (
                            <span className="govuk-tag govuk-tag--blue" style={{ fontSize: '12px' }}>
                              📍 {event.location}
                            </span>
                          )}
                          {event.tags && event.tags.length > 0 && (
                            <>
                              {event.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="govuk-tag govuk-tag--grey" style={{ fontSize: '12px' }}>
                                  #{tag}
                                </span>
                              ))}
                              {event.tags.length > 2 && (
                                <span className="govuk-tag govuk-tag--grey" style={{ fontSize: '12px' }}>
                                  +{event.tags.length - 2} more
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      <button
                        className="govuk-button govuk-button--warning"
                        onClick={() => handleDeleteEvent(event.id)}
                        style={{ marginLeft: '10px', minWidth: '60px', fontSize: '12px', padding: '5px 10px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
