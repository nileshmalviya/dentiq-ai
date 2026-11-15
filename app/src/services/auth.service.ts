import { api, write, restoreSession, setAccessToken } from './apiClient';
export const authService = {
    async login(email: string, password: string, remember: boolean) { const result = await write<{
        user: Record<string, unknown>;
        accessToken: string;
    }>('/auth/login', 'POST', { email, password, remember }); setAccessToken(result.data.accessToken); return result; },
    register: (data: FormData) => write('/auth/register', 'POST', { name: String(data.get('fullName')), email: String(data.get('email')), password: String(data.get('password')), phone: String(data.get('mobile')) }),
    logout: () => write('/auth/logout', 'POST').finally(() => setAccessToken(null)),
    getCurrentUser: () => api<Record<string, unknown>>('/auth/me'), restoreSession,
    forgotPassword: (...values: unknown[]) => write('/auth/forgot-password', 'POST', { email: String(values[0]) }),
    socialLogin: (...values: unknown[]) => { void values; throw new Error('Social sign-in requires a configured identity provider.'); }
};
export function policyUrl(policy: 'terms' | 'privacy'): string | undefined { void policy; return undefined; }
