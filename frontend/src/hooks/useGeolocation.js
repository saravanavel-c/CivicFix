import { useState, useRef, useCallback, useEffect } from 'react';

// Lightweight hook to access browser Geolocation and optionally watch position updates.
export function useGeolocation(options = { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);
  const [watching, setWatching] = useState(false);

  // initialize from persisted last-known location if available
  useEffect(() => {
    try {
      const raw = localStorage.getItem('CivicFix_last_location');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.lat && parsed.lng) {
          setPosition({ lat: String(parsed.lat), lng: String(parsed.lng) });
        }
      }
    } catch (err) {
      // ignore
    }
  }, []);

  const handleSuccess = useCallback((pos) => {
    const { latitude, longitude } = pos.coords;
    const p = { lat: String(latitude), lng: String(longitude), raw: pos };
    setPosition(p);
    // persist last known location
    try {
      localStorage.setItem('CivicFix_last_location', JSON.stringify({ lat: p.lat, lng: p.lng }));
    } catch (err) {
      // ignore storage errors
    }
    setError(null);
  }, []);

  const handleError = useCallback((err) => {
    setError(err);
  }, []);

  const getCurrent = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
  }, [handleSuccess, handleError, options]);

  const startWatching = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError(new Error('Geolocation not supported'));
      return;
    }
    if (watchIdRef.current != null) return; // already watching
    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    watchIdRef.current = id;
    setWatching(true);
    return id;
  }, [handleSuccess, handleError, options]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current != null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setWatching(false);
    }
  }, []);

  useEffect(() => {
    return () => stopWatching();
  }, [stopWatching]);

  return {
    position,
    error,
    getCurrent,
    startWatching,
    stopWatching,
    watching
  };
}

export default useGeolocation;
