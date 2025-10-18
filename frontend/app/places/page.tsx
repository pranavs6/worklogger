'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '@/lib/config'

interface Place {
  id: string
  name: string
  lat: number
  lon: number
  geofence_radius: number
  type: string
}

export default function PlacesPage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPlace, setNewPlace] = useState({
    name: '',
    lat: '',
    lon: '',
    geofence_radius: '100',
    type: 'custom'
  })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPlaces()
  }, [])

  const fetchPlaces = async () => {
    try {
      const response = await axios.get(getApiUrl('/api/places'))
      setPlaces(response.data.places)
    } catch (error) {
      console.error('Error fetching places:', error)
    } finally {
      setLoading(false)
    }
  }

  const addPlace = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(getApiUrl('/api/places'), {
        ...newPlace,
        lat: parseFloat(newPlace.lat),
        lon: parseFloat(newPlace.lon),
        geofence_radius: parseInt(newPlace.geofence_radius)
      })
      setNewPlace({ name: '', lat: '', lon: '', geofence_radius: '100', type: 'custom' })
      setShowAddForm(false)
      fetchPlaces()
    } catch (error) {
      console.error('Error adding place:', error)
    }
  }

  const deletePlace = async (placeId: string) => {
    if (confirm('Are you sure you want to delete this place?')) {
      try {
        await axios.delete(`/api/places/${placeId}`)
        fetchPlaces()
      } catch (error) {
        console.error('Error deleting place:', error)
      }
    }
  }

  const searchOSM = async () => {
    if (!searchQuery.trim()) return
    
    try {
      // Using Nominatim API for OSM search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      )
      const results = await response.json()
      
      if (results.length > 0) {
        const firstResult = results[0]
        setNewPlace({
          ...newPlace,
          name: firstResult.display_name.split(',')[0],
          lat: firstResult.lat,
          lon: firstResult.lon
        })
      }
    } catch (error) {
      console.error('Error searching OSM:', error)
    }
  }

  if (loading) {
    return (
      <div className="govuk-grid">
        <div className="govuk-main-wrapper">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-blue mx-auto"></div>
            <p className="mt-2 text-gov-grey-dark">Loading places...</p>
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
            <h1 className="govuk-heading-xl">Places Management</h1>
            <p className="govuk-body-l">
              Manage your work locations and geofence settings
            </p>
          </div>
        </div>

        {/* Add Place Button */}
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-full">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="govuk-button govuk-button--primary"
            >
              {showAddForm ? 'Cancel' : '+ Add New Place'}
            </button>
          </div>
        </div>

        {/* Add Place Form */}
        {showAddForm && (
          <div className="govuk-grid-row">
            <div className="govuk-grid-column-two-thirds">
              <div className="govuk-card">
                <div className="govuk-card__content">
                  
                  <h2 className="govuk-heading-m">Add New Place</h2>

                  
                  {/* OSM Search */}
                  <div className="govuk-form-group">
                    <label className="govuk-label" htmlFor="search-query">
                      Search OpenStreetMap
                    </label>
                    <div className="flex space-x-2">
                      <input
                        className="govuk-input flex-1"
                        id="search-query"
                        type="text"
                        placeholder="Search for a location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={searchOSM}
                        className="govuk-button govuk-button--secondary"
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  <form onSubmit={addPlace}>
                    <div className="govuk-form-group">
                      <label className="govuk-label" htmlFor="place-name">
                        Place Name
                      </label>
                      <input
                        className="govuk-input"
                        id="place-name"
                        name="name"
                        type="text"
                        value={newPlace.name}
                        onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="govuk-grid-row">
                      <div className="govuk-grid-column-one-half">
                        <div className="govuk-form-group">
                          <label className="govuk-label" htmlFor="place-lat">
                            Latitude
                          </label>
                          <input
                            className="govuk-input"
                            id="place-lat"
                            name="lat"
                            type="number"
                            step="any"
                            value={newPlace.lat}
                            onChange={(e) => setNewPlace({ ...newPlace, lat: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="govuk-grid-column-one-half">
                        <div className="govuk-form-group">
                          <label className="govuk-label" htmlFor="place-lon">
                            Longitude
                          </label>
                          <input
                            className="govuk-input"
                            id="place-lon"
                            name="lon"
                            type="number"
                            step="any"
                            value={newPlace.lon}
                            onChange={(e) => setNewPlace({ ...newPlace, lon: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="govuk-form-group">
                      <label className="govuk-label" htmlFor="geofence-radius">
                        Geofence Radius (meters)
                      </label>
                      <input
                        className="govuk-input"
                        id="geofence-radius"
                        name="geofence_radius"
                        type="number"
                        min="10"
                        max="1000"
                        value={newPlace.geofence_radius}
                        onChange={(e) => setNewPlace({ ...newPlace, geofence_radius: e.target.value })}
                        required
                      />
                    </div>

                    <div className="govuk-form-group">
                      <label className="govuk-label" htmlFor="place-type">
                        Place Type
                      </label>
                      <select
                        className="govuk-select"
                        id="place-type"
                        name="type"
                        value={newPlace.type}
                        onChange={(e) => setNewPlace({ ...newPlace, type: e.target.value })}
                      >
                        <option value="office">Office</option>
                        <option value="home">Home</option>
                        <option value="client">Client Site</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <button type="submit" className="govuk-button">
                      Add Place
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Places List */}
        <br/>
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-full">
            <div className="govuk-card">
              <div className="govuk-card__content">
                <h2 className="govuk-heading-m">Your Places</h2>
                
                {places.length === 0 ? (
                  <p className="govuk-body">No places yet. Add your first place above!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="govuk-table">
                      <thead className="govuk-table__head">
                        <tr className="govuk-table__row">
                          <th className="govuk-table__header">Name</th>
                          <th className="govuk-table__header">Type</th>
                          <th className="govuk-table__header">Coordinates</th>
                          <th className="govuk-table__header">Geofence</th>
                          <th className="govuk-table__header">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="govuk-table__body">
                        {places.map((place) => (
                          <tr key={place.id} className="govuk-table__row">
                            <td className="govuk-table__cell">
                              <strong>{place.name}</strong>
                            </td>
                            <td className="govuk-table__cell">
                              <span className="govuk-tag govuk-tag--blue">
                                {place.type}
                              </span>
                            </td>
                            <td className="govuk-table__cell">
                              <code className="text-sm">
                                {place.lat.toFixed(6)}, {place.lon.toFixed(6)}
                              </code>
                            </td>
                            <td className="govuk-table__cell">
                              {place.geofence_radius}m
                            </td>
                            <td className="govuk-table__cell">
                              <button
                                onClick={() => deletePlace(place.id)}
                                className="govuk-button govuk-button--warning govuk-button--small"
                              >
                                Delete
                              </button>
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
