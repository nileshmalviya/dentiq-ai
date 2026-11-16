import { api, write } from './apiClient';

export type SocialProvider = 'google' | 'facebook' | 'linkedin';
export const socialAuthService = {
  availability: () => api<Record<SocialProvider, boolean>>('/auth/social/providers'),
  async start(provider: SocialProvider) {
    const available = await this.availability();
    if (!available.data[provider]) throw new Error('Social login is not configured yet');
    const result = await write<{ url: string }>(`/auth/social/${provider}/start`, 'POST');
    window.location.assign(result.data.url);
  },
};
