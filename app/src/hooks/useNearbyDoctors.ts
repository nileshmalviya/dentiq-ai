import { useCallback, useEffect, useRef, useState } from 'react';
import { doctorService, type NearbyDoctor } from '../services/doctor.service';
import { useCurrentLocation, type RuntimeCoordinates } from './useCurrentLocation';
import type { Pagination } from '../types/api';
export function useNearbyDoctors(concern: string) {
  // Coordinates are ephemeral component state. Never pass them to routing, storage or events.
  const [coordinates, setCoordinates] = useState<RuntimeCoordinates | null>(null);
  const [cityInput, setCityInput] = useState(''), [city, setCity] = useState('');
  const [page, setPage] = useState(1), [radiusKm, setRadiusKm] = useState(20);
  const [specialization, setSpecialization] = useState(''), [search, setSearch] = useState('');
  const [sort, setSort] = useState<'distance' | 'rating' | 'experience'>('distance');
  const [doctors, setDoctors] = useState<NearbyDoctor[]>([]), [pagination, setPagination] = useState<Pagination>();
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [version, setVersion] = useState(0);
  const request = useRef<AbortController | null>(null), generation = useRef(0);
  const location = useCurrentLocation();
  const clear = useCallback(() => { generation.current++; request.current?.abort(); location.cancel(); setCoordinates(null); setCity(''); setDoctors([]); setPagination(undefined); setError(''); setLoading(false); setPage(1); }, [location.cancel]);
  useEffect(() => () => { generation.current++; request.current?.abort(); }, []);
  async function locate() {
    clear(); const attempt = generation.current;
    const point = await location.requestLocation();
    if (point && attempt === generation.current) { setCoordinates(point); setSort('distance'); }
  }
  function searchCity() {
    clear();
    if (!cityInput.trim()) { setError('Enter a city or locality.'); return; }
    setCity(cityInput.trim());
    setVersion(value => value + 1);
  }
  useEffect(() => { setPage(1); }, [radiusKm, specialization, search, sort, concern]);
  useEffect(() => {
    if (!coordinates && !city) return;
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError(''); setDoctors([]);
    const timer = setTimeout(() => { void doctorService.getNearbyDoctors({ ...(coordinates || { city }), radiusKm, page, limit: 10, specialization, search, sort, concern }, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setDoctors(result.data); setPagination(result.pagination); } })
      .catch(() => { if (!controller.signal.aborted) { setDoctors([]); setPagination(undefined); setError('Nearby doctor search failed. Please try again.'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); }); }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [coordinates, city, radiusKm, page, specialization, search, sort, concern, version]);
  return { doctors, pagination, page, setPage, radiusKm, setRadiusKm, specialization, setSpecialization, search, setSearch, sort, setSort, cityInput, setCityInput, searchCity, locate, clear, refresh: () => setVersion(v => v + 1), precise: Boolean(coordinates), hasSearch: Boolean(coordinates || city), loading, locating: location.locating, error: error || location.error };
}
