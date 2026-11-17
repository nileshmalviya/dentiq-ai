import { useCallback, useEffect, useRef, useState } from 'react';
export interface RuntimeCoordinates { latitude: number; longitude: number; }
export function useCurrentLocation() {
  const [locating, setLocating] = useState(false), [error, setError] = useState('');
  const generation = useRef(0), active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; generation.current++; }; }, []);
  const cancel = useCallback(() => { generation.current++; setLocating(false); setError(''); }, []);
  const requestLocation = useCallback(async (): Promise<RuntimeCoordinates | undefined> => {
    const request = ++generation.current;
    setLocating(true); setError('');
    try {
      if (!window.isSecureContext) throw new Error('Location access requires HTTPS or localhost.');
      if (!navigator.geolocation) throw new Error('Your browser does not support location access. Enter a city or location manually.');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }));
      const { latitude, longitude } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error('Your location could not be determined. Try again or enter it manually.');
      if (active.current && request === generation.current) return { latitude, longitude };
    } catch (reason) {
      const code = typeof reason === 'object' && reason !== null && 'code' in reason ? reason.code : undefined;
      const message = code === 1 ? 'Location permission was denied. You can search by city or locality instead.'
        : code === 3 ? 'Location request timed out. Try again or enter a city or location manually.'
          : code === 2 ? 'Your location could not be determined. Try again or enter it manually.'
            : reason instanceof Error ? reason.message : 'Your location could not be determined. Try again or enter it manually.';
      if (active.current && request === generation.current) setError(message);
    } finally { if (active.current && request === generation.current) setLocating(false); }
  }, []);
  return { locating, error, requestLocation, cancel };
}
