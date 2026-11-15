export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    pagination?: Pagination;
    filters?: Record<string, string[]>;
}
export interface Pagination {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;
const base = ((import.meta as ImportMeta & {
    env: Record<string, string>;
}).env?.VITE_API_BASE_URL || (import.meta as ImportMeta & { env: Record<string, string> }).env?.VITE_API_URL || '/api/v1').replace(/\/$/, '');
export function setAccessToken(token: string | null) { accessToken = token; }
export function invalidate() { window.dispatchEvent(new Event('dentiq:data')); }
export function reportError(error: unknown) { window.dispatchEvent(new CustomEvent('dentiq:error', { detail: error instanceof Error ? error.message : 'Request failed' })); }
export async function restoreSession(): Promise<boolean> { if (!refreshPromise)
    refreshPromise = fetch(`${base}/auth/refresh`, { method: 'POST', credentials: 'include' }).then(async (res) => { if (!res.ok) {
        accessToken = null;
        return false;
    } const body = await res.json(); accessToken = body.data.accessToken; return true; }).catch(() => false).finally(() => { refreshPromise = null; }); return refreshPromise; }
export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<ApiResponse<T>> {
    let res: Response;
    try {
        res = await fetch(`${base}${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...options.headers } });
    } catch {
        throw new Error('Cannot connect to the API. Start the API with npm run dev:api from the project root and try again.');
    }
    if (res.status === 401 && retry && !path.startsWith('/auth/') && await restoreSession())
        return api<T>(path, options, false);
    let body: ApiResponse<T> & { errors?: { path?: string; message?: string }[] };
    try {
        body = await res.json();
    } catch {
        throw new Error([500, 502, 503, 504].includes(res.status)
            ? 'The backend API is unavailable. Start the API with npm run dev:api from the project root and try again.'
            : 'The API returned an unexpected response. Check the API URL and proxy configuration.');
    }
    if (!body || typeof body !== 'object' || typeof body.success !== 'boolean') {
        throw new Error('The API returned an unexpected response. Check the API URL and proxy configuration.');
    }
    if (!res.ok || !body.success)
        throw new Error(body.errors?.length ? `${body.message}: ${body.errors.map((e: {
            path?: string;
            message?: string;
        }) => `${e.path || ''} ${e.message || ''}`).join(', ')}` : body.message || 'Request failed');
    return body;
}
export const write = <T>(path: string, method: string, data?: unknown) => api<T>(path, { method, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
