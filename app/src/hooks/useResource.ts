import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {readResource,persistResourceRows} from '../services/resourceRegistry';
import {invalidate,reportError} from '../utils/apiEvents';
import type {Pagination} from '../types/api';
export interface RemoteMeta {
    endpoint: string;
    query: string;
    setQuery: (query: string) => void;
    pagination?: Pagination;
    filters?: Record<string, string[]>;
    loading: boolean;
    error: string;
}
const metadata = new WeakMap<object, RemoteMeta>();
export function remoteMeta(rows: object) { return metadata.get(rows); }
export function useResource<T>(endpoint: string | null, initial: T) {
    const [data, setData] = useState(initial), [loading, setLoading] = useState(Boolean(endpoint)), [error, setError] = useState(''), [version, setVersion] = useState(0);
    useEffect(() => { const refresh = () => setVersion(v => v + 1); window.addEventListener('dentiq:data', refresh); return () => window.removeEventListener('dentiq:data', refresh); }, []);
    useEffect(() => { let active = true; if (!endpoint) {
        setData(initial);
        setLoading(false);
        return;
    } setLoading(true); setError(''); readResource<T>(endpoint).then(r => { if (active)
        setData(r.data); }).catch(e => { if (active) {
        setError(e.message);
        reportError(e);
    } }).finally(() => { if (active)
        setLoading(false); }); return () => { active = false; }; }, [endpoint, version]);
    return { data, loading, error, reload: () => setVersion(v => v + 1) };
}
export function useResourceRows<T extends {
    id: string;
}>(endpoint: string | null): [
    T[],
    Dispatch<SetStateAction<T[]>>
] {
    const [facets, setFacets] = useState<Record<string, string[]>>({});
    const [query, setQuery] = useState(''), [rows, setRows] = useState<T[]>([]), [pagination, setPagination] = useState<Pagination>(), [loading, setLoading] = useState(Boolean(endpoint)), [error, setError] = useState(''), [version, setVersion] = useState(0);
    useEffect(() => { setRows([]); setPagination(undefined); setQuery(''); }, [endpoint]);
    useEffect(() => { const refresh = () => setVersion(v => v + 1); window.addEventListener('dentiq:data', refresh); return () => window.removeEventListener('dentiq:data', refresh); }, []);
    useEffect(() => { let active = true; if (!endpoint)
        return; setLoading(true); setError(''); const timer = setTimeout(() => readResource<T[]>(endpoint,query).then(r => { if (active) {
        setRows(r.data);
        setPagination(r.pagination);
        setFacets(r.filters || {});
    } }).catch(e => { if (active)
        setError(e.message); }).finally(() => { if (active)
        setLoading(false); }), 120); return () => { active = false; clearTimeout(timer); }; }, [endpoint, query, version]);
    const result = useMemo(() => rows, [rows]);
    metadata.set(result, { endpoint: endpoint || '', query, setQuery, pagination, filters: facets, loading, error });
    const persist = useCallback((action: SetStateAction<T[]>) => {
        const next = typeof action === 'function' ? action(rows) : action;
        void (async () => {
            if (!endpoint)
                return;
            await persistResourceRows(endpoint,rows,next);
            invalidate();
        })().catch(reportError);
    }, [endpoint, rows]);
    return [result, persist];
}
export function usePortalEndpoint() { return location.pathname.startsWith('/super-admin') ? '/admin' : '/doctor'; }
export function copyRemote<T extends object>(source: object, target: T): T { const meta = metadata.get(source); if (meta)
    metadata.set(target, meta); return target; }
