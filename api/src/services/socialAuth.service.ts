import { createHash, createHmac, createPublicKey, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { Env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import type { AuthService } from './auth.service.js';
import type { SocialAuthRepository, SocialProfile } from '../repositories/socialAuth.repository.js';

export const providers = ['google', 'facebook', 'linkedin'] as const;
export type SocialProvider = typeof providers[number];
export const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const random = () => randomBytes(32).toString('base64url');
const oidc = {
  google: { authorization: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token', userinfo: 'https://openidconnect.googleapis.com/v1/userinfo', jwks: 'https://www.googleapis.com/oauth2/v3/certs', discovery: 'https://accounts.google.com/.well-known/openid-configuration' },
  linkedin: { authorization: 'https://www.linkedin.com/oauth/v2/authorization', token: 'https://www.linkedin.com/oauth/v2/accessToken', userinfo: 'https://api.linkedin.com/v2/userinfo', jwks: 'https://www.linkedin.com/oauth/openid/jwks', discovery: 'https://www.linkedin.com/oauth/.well-known/openid-configuration' },
};
async function json(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new AppError(502, 'Social login provider is unavailable. Please try again.');
  const body = await response.json() as Record<string, any>;
  if (body.error) throw new AppError(401, 'Social login was not completed.');
  return body;
}
export class SocialAuthService {
  constructor(private env: Env, private store: SocialAuthRepository, private auth: AuthService) {}
  provider(value: unknown): SocialProvider {
    if (!providers.includes(value as SocialProvider)) throw new AppError(400, 'Unsupported social login provider.');
    return value as SocialProvider;
  }
  private config(provider: SocialProvider) {
    const prefix = provider.toUpperCase() as 'GOOGLE' | 'FACEBOOK' | 'LINKEDIN';
    return { id: this.env[`${prefix}_CLIENT_ID`], secret: this.env[`${prefix}_CLIENT_SECRET`], redirect: this.env[`${prefix}_REDIRECT_URI`] };
  }
  availability() { return Object.fromEntries(providers.map(provider => { const c = this.config(provider); return [provider, Boolean(c.id && c.secret && c.redirect)]; })); }
  private configured(provider: SocialProvider) {
    const c = this.config(provider);
    if (!c.id || !c.secret || !c.redirect) throw new AppError(503, 'Social login is not configured yet');
    return { id: c.id, secret: c.secret, redirect: c.redirect };
  }
  async start(provider: SocialProvider) {
    const c = this.configured(provider), state = random(), browser = random(), nonce = random();
    let verifier = '', issuer = '';
    if (provider !== 'facebook') {
      const discovery = await json(oidc[provider].discovery);
      const allowed = provider === 'google' ? ['https://accounts.google.com'] : ['https://www.linkedin.com', 'https://www.linkedin.com/oauth'];
      if (!allowed.includes(discovery.issuer)) throw new AppError(502, 'Invalid provider configuration.');
      issuer = discovery.issuer;
      if (provider === 'google' || discovery.code_challenge_methods_supported?.includes('S256')) verifier = random();
    }
    const url = new URL(provider === 'facebook' ? `https://www.facebook.com/${this.env.FACEBOOK_GRAPH_VERSION}/dialog/oauth` : oidc[provider].authorization);
    url.search = new URLSearchParams({ client_id: c.id, redirect_uri: c.redirect, response_type: 'code', state, scope: provider === 'facebook' ? 'public_profile,email' : 'openid profile email' }).toString();
    if (provider !== 'facebook') url.searchParams.set('nonce', nonce);
    if (verifier) { url.searchParams.set('code_challenge', createHash('sha256').update(verifier).digest('base64url')); url.searchParams.set('code_challenge_method', 'S256'); }
    await this.store.saveAttempt({ stateHash: hash(state), browserHash: hash(browser), provider, nonce, verifier, issuer, expiresAt: new Date(Date.now() + 600000) });
    return { url: url.toString(), browser };
  }
  async callback(provider: SocialProvider, state: string, browser: string, code: string, denied: boolean) {
    const c = this.configured(provider);
    if (!state || state.length > 200 || !browser) throw new AppError(400, 'Invalid or expired social login. Please try again.');
    const attempt = await this.store.consumeAttempt(hash(state), hash(browser), provider);
    if (!attempt) throw new AppError(400, 'Invalid or expired social login. Please try again.');
    if (denied || !code || code.length > 4096) throw new AppError(401, 'Social login was cancelled or denied.');
    const parameters = new URLSearchParams({ grant_type: 'authorization_code', code, client_id: c.id, client_secret: c.secret, redirect_uri: c.redirect });
    if (attempt.verifier) parameters.set('code_verifier', attempt.verifier);
    const graph = `https://graph.facebook.com/${this.env.FACEBOOK_GRAPH_VERSION}`;
    const token = await json(provider === 'facebook' ? `${graph}/oauth/access_token` : oidc[provider].token, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: parameters });
    if (typeof token.access_token !== 'string') throw new AppError(401, 'Provider did not return an access token.');
    let profile: SocialProfile;
    if (provider === 'facebook') {
      const debug = new URL(`${graph}/debug_token`);
      debug.searchParams.set('input_token', token.access_token);
      const checked = (await json(debug.toString(), { headers: { Authorization: `Bearer ${c.id}|${c.secret}` } })).data;
      if (!checked?.is_valid || String(checked.app_id) !== c.id || !checked.user_id || !(checked.expires_at > Date.now() / 1000) || (checked.data_access_expires_at && checked.data_access_expires_at <= Date.now() / 1000)) throw new AppError(401, 'Invalid Facebook session.');
      const url = new URL(`${graph}/me`);
      url.searchParams.set('fields', 'id,name,email');
      url.searchParams.set('appsecret_proof', createHmac('sha256', c.secret).update(token.access_token).digest('hex'));
      const info = await json(url.toString(), { headers: { Authorization: `Bearer ${token.access_token}` } });
      if (info.id !== checked.user_id) throw new AppError(401, 'Invalid Facebook identity.');
      profile = { provider, subject: info.id, email: info.email, name: info.name, emailVerified: false };
    } else {
      if (typeof token.id_token !== 'string') throw new AppError(401, 'Provider did not return an ID token.');
      const decoded = jwt.decode(token.id_token, { complete: true });
      if (!decoded || decoded.header.alg !== 'RS256' || !decoded.header.kid) throw new AppError(401, 'Invalid provider ID token.');
      const keys = await json(oidc[provider].jwks);
      const key = keys.keys?.find((k: Record<string, unknown>) => k.kid === decoded.header.kid && k.kty === 'RSA' && (!k.use || k.use === 'sig') && (!k.alg || k.alg === 'RS256'));
      if (!key) throw new AppError(401, 'Provider signing key unavailable.');
      const claims = jwt.verify(token.id_token, createPublicKey({ key, format: 'jwk' }), { algorithms: ['RS256'], issuer: provider === 'google' ? [attempt.issuer, 'accounts.google.com'] : attempt.issuer, audience: c.id }) as jwt.JwtPayload;
      if (!claims.sub || !claims.exp || !claims.iat || claims.iat > Date.now() / 1000 + 60 || claims.nonce !== attempt.nonce || (claims.azp && claims.azp !== c.id) || (Array.isArray(claims.aud) && claims.aud.length > 1 && claims.azp !== c.id)) throw new AppError(401, 'Invalid provider claims.');
      if (claims.at_hash !== undefined && claims.at_hash !== createHash('sha256').update(token.access_token).digest().subarray(0, 16).toString('base64url')) throw new AppError(401, 'Invalid provider token binding.');
      const info = await json(oidc[provider].userinfo, { headers: { Authorization: `Bearer ${token.access_token}` } });
      if (info.sub !== claims.sub || info.email_verified !== true) throw new AppError(401, 'A verified email address is required for social login.');
      profile = { provider, subject: claims.sub, email: info.email, name: info.name, emailVerified: true };
    }
    const validated = z.object({ subject: z.string().min(1).max(255), email: z.string().email().max(254).transform(v => v.toLowerCase()), name: z.string().trim().min(1).max(200), provider: z.string(), emailVerified: z.boolean() }).safeParse(profile);
    if (!validated.success) throw new AppError(401, 'Your provider must share your name and email. Please grant email permission or use email/password registration.');
    return this.auth.socialPatientSession(await this.store.patient(validated.data));
  }
}
