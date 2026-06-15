import { useState, useEffect } from 'react'

// useGeolocation — requests browser location once on mount. | Returns { coords: { lat, lng }, loading, denied }. | 'denied' is true if the user blocked location or the browser can't access it.
export function useGeolocation() {
  const [coords,  setCoords]  = useState(null)   // { lat, lng }
  const [loading, setLoading] = useState(true)
  const [denied,  setDenied]  = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) {
      setDenied(true)
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      () => {
        setDenied(true)
        setLoading(false)
      },
      { timeout: 8000, maximumAge: 300_000 }
    )
  }, [])

  return { coords, loading, denied }
}

// haversineKm — great-circle distance in kilometres between two lat/lng points.
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R  = 6371
  const dL = ((lat2 - lat1) * Math.PI) / 180
  const dG = ((lng2 - lng1) * Math.PI) / 180
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dG / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// sortByDistance — adds a `distKm` field and sorts nearest-first. | Falls back to the original order if no coords.
export function sortByDistance(items, coords) {
  if (!coords) return items
  return [...items]
    .map(item => ({
      ...item,
      distKm: haversineKm(coords.lat, coords.lng, item.latitude, item.longitude),
    }))
    .sort((a, b) => a.distKm - b.distKm)
}

// fmtDist — formats km distance to a human-friendly string
export function fmtDist(km) {
  if (km == null) return null
  if (km < 1)    return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
