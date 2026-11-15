import { api, write } from './apiClient';
export function queryPath(endpoint: string, query?: string | Record<string, string | number | undefined>) {
    const params = typeof query === 'string' ? query : new URLSearchParams(Object.entries(query || {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();
    return params ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}${params}` : endpoint;
}
export function createResourceService(prefixes: string[]) {
    return { prefixes, read<T>(endpoint: string, query?: string | Record<string, string | number | undefined>) { return api<T>(queryPath(endpoint, query)); },
        create<T>(endpoint: string, data: unknown) { return write<T>(endpoint, 'POST', data); }, update<T>(endpoint: string, data: unknown) { return write<T>(endpoint, 'PATCH', data); }, remove<T>(endpoint: string) { return write<T>(endpoint, 'DELETE'); } };
}
