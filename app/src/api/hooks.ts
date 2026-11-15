import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { api, invalidate, reportError, write } from './client';
import type { Pagination } from './client';
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
    } setLoading(true); setError(''); api<T>(endpoint).then(r => { if (active)
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
        return; setLoading(true); setError(''); const timer = setTimeout(() => api<T[]>(`${endpoint}${endpoint.includes('?') ? '&' : '?'}${query}`).then(r => { if (active) {
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
            for (const row of next) {
                const old = rows.find(item => item.id === row.id);
                if (!old) {
                    const { id, ...data } = row;
                    void id;
                    await write(endpoint, 'POST', data);
                }
                else {
                    const changes = Object.fromEntries(Object.entries(row).filter(([key, value]) => key !== 'id' && JSON.stringify(value) !== JSON.stringify((old as Record<string, unknown>)[key])));
                    if (Object.keys(changes).length)
                        await write(`${endpoint}/${row.id}`, 'PATCH', changes);
                }
            }
            for (const old of rows)
                if (!next.some(row => row.id === old.id))
                    await write(`${endpoint}/${old.id}`, 'DELETE');
            invalidate();
        })().catch(reportError);
    }, [endpoint, rows]);
    return [result, persist];
}
export function usePortalEndpoint() { return location.pathname.startsWith('/super-admin') ? '/admin' : '/doctor'; }
export function copyRemote<T extends object>(source: object, target: T): T { const meta = metadata.get(source); if (meta)
    metadata.set(target, meta); return target; }
