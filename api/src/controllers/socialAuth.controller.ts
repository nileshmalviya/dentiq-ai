import type { Env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { ok, wrap } from '../middleware/index.js';
import type { SocialAuthService } from '../services/socialAuth.service.js';

export class SocialAuthController {
  constructor(private social: SocialAuthService, private env: Env) {}
  private get attemptCookie() { return { httpOnly: true, secure: this.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/api/v1/auth/social' }; }
  availability = wrap(async (_req, res) => { res.setHeader('Cache-Control', 'no-store'); return ok(res, this.social.availability()); });
  start = wrap(async (req, res) => {
    const provider = this.social.provider(req.params.provider);
    const result = await this.social.start(provider);
    res.setHeader('Cache-Control', 'no-store');
    res.cookie(`dentiq_oauth_${provider}`, result.browser, { ...this.attemptCookie, maxAge: 600000 });
    return ok(res, { url: result.url });
  });
  callback = wrap(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    const provider = this.social.provider(req.params.provider);
    const scalar = (value: unknown) => typeof value === 'string' ? value : '';
    const browser = scalar(req.cookies[`dentiq_oauth_${provider}`]);
    res.clearCookie(`dentiq_oauth_${provider}`, this.attemptCookie);
    try {
      const result = await this.social.callback(provider, scalar(req.query.state), browser, scalar(req.query.code), req.query.error !== undefined);
      res.cookie('dentiq_refresh', result.refreshToken, { httpOnly: true, secure: this.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1/auth' });
      return res.redirect(303, new URL('/patient/chat', this.env.CLIENT_URL).toString());
    } catch (error) {
      const url = new URL('/login', this.env.CLIENT_URL);
      url.searchParams.set('social_error', error instanceof AppError && error.status < 500 ? error.message : 'Social login could not be completed. Please try again.');
      return res.redirect(303, url.toString());
    }
  });
}
