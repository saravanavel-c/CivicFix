import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

// Lightweight hook to access browser Geolocation and optionally watch position updates.
export function useGeolocation(userOptions = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);
  const [watching, setWatching] = useState(false);

  const options = useMemo(() => ({
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 15000,
    ...userOptions
  }), [JSON.stringify(userOptions)]);

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

    const errorCallback = (err) => {
      if (options.enableHighAccuracy) {
        console.warn("High accuracy geolocation failed, retrying with low accuracy...", err);
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (err2) => {
            setError(err2);
          },
          { ...options, enableHighAccuracy: false }
        );
      } else {
        setError(err);
      }
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, errorCallback, options);
  }, [handleSuccess, options]);

  const startWatching = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError(new Error('Geolocation not supported'));
      return;
    }
    if (watchIdRef.current != null) return; // already watching

    const errorCallback = (err) => {
      if (options.enableHighAccuracy) {
        console.warn("High accuracy watchPosition failed, retrying with low accuracy...", err);
        if (watchIdRef.current != null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        const id = navigator.geolocation.watchPosition(
          handleSuccess,
          (err2) => setError(err2),
          { ...options, enableHighAccuracy: false }
        );
        watchIdRef.current = id;
      } else {
        setError(err);
      }
    };

    const id = navigator.geolocation.watchPosition(handleSuccess, errorCallback, options);
    watchIdRef.current = id;
    setWatching(true);
    return id;
  }, [handleSuccess, options]);

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
