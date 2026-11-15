import type { ApiResponse } from '../types/api';
export type { ApiResponse, Pagination } from '../types/api';
let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;
const base = ((import.meta as ImportMeta & {
    env: Record<string, string>;
}).env?.VITE_API_BASE_URL || (import.meta as ImportMeta & {
    env: Record<string, string>;
}).env?.VITE_API_URL || '/api/v1').replace(/\/$/, '');
export function setAccessToken(token: string | null) { accessToken = token; }
async function transport(path: string, options: RequestInit = {}) {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), (path.startsWith('/doctor-registration')?45000:15000));
    const abort = () => controller.abort(options.signal?.reason);
    if (options.signal?.aborted)
        abort();
    else
        options.signal?.addEventListener('abort', abort, { once: true });
    try {
        const response = await fetch(`${base}${path}`, { ...options, credentials: 'include', signal: controller.signal });
        const body = await response.arrayBuffer();
        return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
    }
    finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener('abort', abort);
    }
}
export async function restoreSession(): Promise<boolean> {
    if (!refreshPromise)
        refreshPromise = transport('/auth/refresh', { method: 'POST' }).then(async (res) => {
            if (!res.ok) {
                accessToken = null;
                return false;
            }
            const body = await res.json();
            if (typeof body.data?.accessToken !== 'string') {
                accessToken = null;
                return false;
            }
            accessToken = body.data.accessToken;
            return true;
        }).catch(() => false).finally(() => { refreshPromise = null; });
    return refreshPromise;
}
export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<ApiResponse<T>> {
    let res: Response;
    try {
        res = await transport(path, { ...options, headers: { ...(options.body instanceof FormData ? {} : {'Content-Type': 'application/json'}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...options.headers } });
    }
    catch (error) {
        if (error instanceof DOMException && error.name === 'TimeoutError')
            throw new Error('The API request timed out. Please try again.');
        throw new Error('Cannot connect to the API. Start the API with npm run dev:api from the project root and try again.');
    }
    if (res.status === 401 && retry && !path.startsWith('/auth/') && await restoreSession())
        return api<T>(path, options, false);
    let body: ApiResponse<T> & {
        errors?: {
            path?: string;
            message?: string;
        }[];
    };
    try {
        body = await res.json();
    }
    catch {
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

export async function downloadFile(path:string,retry=true):Promise<Blob>{const res=await transport(path,{headers:accessToken?{Authorization:'Bearer '+accessToken}:{}});if(res.status===401&&retry&&await restoreSession())return downloadFile(path,false);if(!res.ok){const body=await res.json().catch(()=>null);throw new Error(body?.message||'Document download failed');}return res.blob();}
