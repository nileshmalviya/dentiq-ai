import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { readEnv } from '../src/config/env.js';
import { SocialAuthService, hash, type SocialProvider } from '../src/services/socialAuth.service.js';
import { SocialAuthRepository } from '../src/repositories/socialAuth.repository.js';
import { AuthService } from '../src/services/auth.service.js';
import { models } from '../src/models/resource.model.js';

const env = readEnv({ NODE_ENV: 'test', MONGODB_URI: 'mongodb://localhost/test', CLIENT_URL: 'http://localhost:5173', JWT_ACCESS_SECRET: 'a'.repeat(32), JWT_REFRESH_SECRET: 'b'.repeat(32), ...Object.fromEntries(['GOOGLE', 'FACEBOOK', 'LINKEDIN'].flatMap(p => [[`${p}_CLIENT_ID`, 'test-client'], [`${p}_CLIENT_SECRET`, 'test-secret'], [`${p}_REDIRECT_URI`, `http://localhost:5000/api/v1/auth/social/${p.toLowerCase()}/callback`]])) });
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' };

function setup(provider: SocialProvider, changes: Record<string, unknown> = {}) {
  let attempt: Record<string, any> | undefined;
  let profile: Record<string, any> | undefined;
  let exchanged: URLSearchParams | undefined;
  const issuer = provider === 'google' ? 'https://accounts.google.com' : 'https://www.linkedin.com/oauth';
  const store = {
    async saveAttempt(value: Record<string, any>) { attempt = value; },
    async consumeAttempt(stateHash: string, browserHash: string, name: string) {
      if (!attempt || attempt.stateHash !== stateHash || attempt.browserHash !== browserHash || attempt.provider !== name || attempt.expiresAt <= new Date()) return null;
      const result = attempt; attempt = undefined; return result;
    },
    async patient(value: Record<string, any>) { profile = value; return { id: 'patient-user', role: 'PATIENT', status: 'Active' }; },
  };
  let savedNonce = '';
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    let response: unknown;
    if (url.includes('.well-known')) response = { issuer, ...(provider === 'google' ? { code_challenge_methods_supported: ['S256'] } : {}) };
    else if (url.includes('debug_token')) response = { data: { is_valid: true, app_id: 'test-client', user_id: 'subject', expires_at: Date.now() / 1000 + 3600, ...changes } };
    else if (url.includes('/me?')) {
      assert.ok(new URL(url).searchParams.get('appsecret_proof'));
      response = { id: 'subject', name: 'Test Patient', email: 'patient@example.com' };
    } else if (url.includes('userinfo')) response = { sub: 'subject', name: 'Test Patient', email: 'patient@example.com', email_verified: true };
    else if (url.includes('jwks') || url.includes('certs')) response = { keys: [jwk] };
    else {
      exchanged = init?.body as URLSearchParams;
      response = { access_token: 'provider-token', id_token: jwt.sign({ sub: 'subject', nonce: savedNonce, ...changes }, privateKey, { algorithm: 'RS256', keyid: 'test-key', issuer, audience: 'test-client', expiresIn: '5m' }) };
    }
    return new Response(JSON.stringify(response), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const auth = { async socialPatientSession(user: unknown) { return { user, refreshToken: 'local-refresh' }; } };
  const service = new SocialAuthService(env, store as unknown as SocialAuthRepository, auth as unknown as AuthService);
  return { service, fetcher, get profile() { return profile; }, get exchanged() { return exchanged; }, expire() { if (attempt) attempt.expiresAt = new Date(0); }, async start() { const result = await service.start(provider); savedNonce = attempt?.nonce; return { ...result, state: new URL(result.url).searchParams.get('state')! }; } };
}

test('missing credentials disables all providers before any network or database access', async () => {
  const empty = { ...env, GOOGLE_CLIENT_ID: undefined, FACEBOOK_CLIENT_SECRET: undefined, LINKEDIN_REDIRECT_URI: undefined };
  const service = new SocialAuthService(empty, {} as SocialAuthRepository, {} as AuthService);
  assert.deepEqual(service.availability(), { google: false, facebook: false, linkedin: false });
  for (const provider of ['google', 'facebook', 'linkedin'] as const) await assert.rejects(service.start(provider), /Social login is not configured yet/);
  assert.throws(() => service.provider('doctor'), /Unsupported/);
});

for (const provider of ['google', 'facebook', 'linkedin'] as const) {
  test(`${provider}: authorization, validated identity, patient session and replay rejection`, async t => {
    const fixture = setup(provider);
    t.mock.method(globalThis, 'fetch', fixture.fetcher);
    const start = await fixture.start();
    const url = new URL(start.url);
    assert.equal(url.searchParams.get('response_type'), 'code');
    assert.equal(url.searchParams.get('client_secret'), null);
    const result = await fixture.service.callback(provider, start.state, start.browser, 'code', false);
    assert.equal(result.refreshToken, 'local-refresh');
    assert.equal(fixture.profile?.provider, provider);
    assert.equal(fixture.profile?.emailVerified, provider !== 'facebook');
    if (provider === 'google') assert.equal(url.searchParams.get('code_challenge'), createHash('sha256').update(fixture.exchanged!.get('code_verifier')!).digest('base64url'));
    await assert.rejects(fixture.service.callback(provider, start.state, start.browser, 'code', false), /Invalid or expired/);
  });
}

test('state mismatch, wrong browser, expiry and denial do not create a patient', async t => {
  const f = setup('google'); t.mock.method(globalThis, 'fetch', f.fetcher);
  const start = await f.start();
  await assert.rejects(f.service.callback('google', 'wrong', start.browser, 'code', false), /Invalid or expired/);
  await assert.rejects(f.service.callback('google', start.state, 'other-browser', 'code', false), /Invalid or expired/);
  assert.equal(f.profile, undefined);
  f.expire();
  await assert.rejects(f.service.callback('google', start.state, start.browser, 'code', false), /Invalid or expired/);
  const next = await f.start();
  await assert.rejects(f.service.callback('google', next.state, next.browser, '', true), /cancelled or denied/);
  assert.equal(f.profile, undefined);
  assert.notEqual(hash(start.state), start.state);
});

for (const changes of [{ nonce: 'wrong' }, { aud: 'wrong-client' }, { iss: 'https://attacker.example' }, { exp: 1 }, { azp: 'other-client' }, { at_hash: 'wrong' }]) {
  test(`OIDC rejects invalid claims: ${Object.keys(changes)[0]}`, async t => {
    const f = setup('google', changes);
    // Construct an ID token with controlled invalid claims without duplicate sign options.
    t.mock.method(globalThis, 'fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      if (String(input) === 'https://oauth2.googleapis.com/token') {
        const nonce = new URL(currentUrl).searchParams.get('nonce');
        const token = jwt.sign({ sub: 'subject', nonce, aud: 'test-client', iss: 'https://accounts.google.com', exp: Math.floor(Date.now() / 1000) + 300, ...changes }, privateKey, { algorithm: 'RS256', keyid: 'test-key' });
        return new Response(JSON.stringify({ access_token: 'provider-token', id_token: token }));
      }
      return f.fetcher(input, init);
    });
    let currentUrl = '';
    const start = await f.start(); currentUrl = start.url;
    await assert.rejects(f.service.callback('google', start.state, start.browser, 'code', false));
    assert.equal(f.profile, undefined);
  });
}

test('Facebook rejects a token issued to a different app', async t => {
  const f = setup('facebook', { app_id: 'another-app' }); t.mock.method(globalThis, 'fetch', f.fetcher);
  const start = await f.start();
  await assert.rejects(f.service.callback('facebook', start.state, start.browser, 'code', false), /Invalid Facebook/);
  assert.equal(f.profile, undefined);
});

test('social session refuses doctor, administrator and inactive patient roles', async () => {
  const auth = new AuthService({} as never, {} as never, env);
  for (const role of ['DOCTOR', 'SUPER_ADMIN']) await assert.rejects(auth.socialPatientSession({ id: 'user', role, status: 'Active' }), /patient accounts only/);
  await assert.rejects(auth.socialPatientSession({ id: 'user', role: 'PATIENT', status: 'Inactive' }), /patient accounts only/);
});

test('repository refuses email collisions before writing any user, including privileged accounts', async t => {
  // No database connection: intercept only the lookups for the collision branch.
  const mongoose = await import('mongoose');
  const identity = mongoose.default.models['social-identities'];
  t.mock.method(identity, 'findOne', () => ({ lean: async () => null }));
  t.mock.method(models.users, 'exists', async () => ({ _id: 'existing-user' }));
  await assert.rejects(new SocialAuthRepository().patient({ provider: 'google', subject: 'subject', name: 'Patient', email: 'existing@example.com', emailVerified: true }), /existing login method/);
});

test('repository creates user, patient and identity in one transaction with PATIENT role', async t => {
  const mongoose = await import('mongoose');
  const identity = mongoose.default.models['social-identities'];
  const writes: { kind: string; rows: Record<string, any>[]; session: unknown }[] = [];
  const session = {};
  t.mock.method(identity, 'findOne', () => ({ lean: async () => null }));
  t.mock.method(models.users, 'exists', async () => null);
  t.mock.method(mongoose.default.connection, 'transaction', async (action: (s: unknown) => Promise<unknown>) => action(session));
  for (const [kind, model] of [['user', models.users], ['patient', models.patients], ['identity', identity]] as const) {
    t.mock.method(model, 'create', async (rows: Record<string, any>[], options: { session: unknown }) => { writes.push({ kind, rows, session: options.session }); return rows; });
  }
  const user = await new SocialAuthRepository().patient({ provider: 'google', subject: 'subject', name: 'Test Patient', email: 'test@example.com', emailVerified: true });
  assert.equal(user.role, 'PATIENT');
  assert.match(user.passwordHash, /^\$2[aby]\$/);
  assert.deepEqual(writes.map(w => w.kind), ['user', 'patient', 'identity']);
  assert.ok(writes.every(w => w.session === session));
  assert.equal(writes[1].rows[0].userId, user.id);
  assert.equal(writes[1].rows[0].id, user.patientId);
  assert.equal(writes[2].rows[0].userId, user.id);
});

test('repository finds an active linked patient and refuses unavailable accounts', async t => {
  const mongoose = await import('mongoose');
  const identity = mongoose.default.models['social-identities'];
  t.mock.method(identity, 'findOne', () => ({ lean: async () => ({ userId: 'linked-user' }) }));
  let available = true;
  t.mock.method(models.users, 'findOne', (filter: Record<string, unknown>) => {
    assert.deepEqual(filter, { id: 'linked-user', role: 'PATIENT', status: 'Active' });
    return { lean: async () => available ? { id: 'linked-user', patientId: 'linked-patient', role: 'PATIENT', status: 'Active' } : null };
  });
  t.mock.method(models.patients, 'exists', async () => ({ _id: 'patient' }));
  const repository = new SocialAuthRepository();
  const profile = { provider: 'google', subject: 'subject', name: 'Patient', email: 'patient@example.com', emailVerified: true };
  assert.equal((await repository.patient(profile)).id, 'linked-user');
  available = false;
  await assert.rejects(repository.patient(profile), /Patient account unavailable/);
});
