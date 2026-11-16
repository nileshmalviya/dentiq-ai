# Patient social login

Google, Facebook and LinkedIn buttons are available on `/login` (the shared password login page, explicitly labeled Patient social login) and `/register`. Doctor registration and administrator/doctor authentication are unchanged. Signed-in doctors and administrators do not see the social buttons. OAuth always creates/logs in a PATIENT; there is no client-controlled role or redirect.

## Configure

Copy the social variables from `api/.env.example` into your private `api/.env`. Configure each provider's client ID/app ID, client secret and exact redirect URI. Missing any of those three values disables that provider with `Social login is not configured yet`. No frontend secrets or additional frontend environment variables are needed.

Register these local callback URLs with the respective provider:

- Google: `http://localhost:5000/api/v1/auth/social/google/callback`
- Facebook: `http://localhost:5000/api/v1/auth/social/facebook/callback`
- LinkedIn: `http://localhost:5000/api/v1/auth/social/linkedin/callback`

For production use HTTPS callback URLs at the public API origin, the configured HTTPS CLIENT_URL, and the existing same-site frontend/API deployment required by the Strict refresh cookie. Keep local frontend and API hostnames consistent (`localhost` on both). Behind a development proxy, the callback must use the same API origin reached by frontend API requests so the browser binding cookie is available.

Enable Google OpenID Connect (`openid profile email`), Facebook Login with `public_profile,email`, and LinkedIn's **Sign In with LinkedIn using OpenID Connect** product (`openid profile email`). Complete provider consent screens, test user setup and any provider app review required before public use. Facebook Graph API version is configurable; the default is v24.0. Restart the API after configuration.

## Authentication and storage

- `GET /api/v1/auth/social/providers`: provider availability booleans, no credentials.
- `POST /api/v1/auth/social/:provider/start`: checks configuration, saves a ten-minute attempt and sets an HttpOnly SameSite=Lax browser binding cookie; returns the authorization URL.
- `GET /api/v1/auth/social/:provider/callback`: consumes state once, checks the browser binding and expiry, exchanges the code server-side, and validates provider identity.
- Google uses S256 PKCE. LinkedIn enables S256 only if its trusted discovery document advertises support (currently absent); both use nonce and RS256 signature, issuer, audience, expiration, authorized-party, optional access-token hash and matching userinfo subject checks.
- Facebook validates token app ID, user ID, expiry and data-access expiry through `debug_token`, and uses HMAC app-secret proof on profile retrieval. Its email is not treated as verified.
- Missing name/email or unverified Google/LinkedIn email fails with guidance to use password registration. Provider email permission must be granted.
- MongoDB `social-identities` has a unique provider/subject index. Existing provider identities find their active patient account. New identities create user, patient and identity records in one transaction. MongoDB transactions require a replica set/Atlas, as does existing patient signup. `social-attempts` has unique state hashes and a TTL index; expiry is also enforced in the query. Provider tokens are never stored.
- An existing email is **never automatically linked**, including existing patients. The user must use their original login method. This avoids email-based account takeover and prevents social access to doctor/admin accounts. Account linking is outside this feature.
- Social-only accounts receive an unguessable random password hash; no known password is assigned. Phone is left blank for completion in the patient profile.
- Success issues the existing JWT refresh session cookie and redirects to `/patient/chat`. The existing AuthProvider restores the access token into memory through `/auth/refresh`. Tokens never appear in redirect URLs. Callback failure redirects to `/login` with a safe error message.

## Validation

Run `npm run typecheck`, `npm run build`, and `npm --prefix api run test:social`. The tests simulate provider responses strictly inside tests; production has no mock or bypass mode. Real consent/callback testing requires real provider credentials and has not been completed without them.

Provider references: [Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect), [LinkedIn OIDC](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2), [LinkedIn discovery](https://www.linkedin.com/oauth/.well-known/openid-configuration), [Facebook manual flow](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/), [Facebook secure requests](https://developers.facebook.com/docs/graph-api/guides/secure-requests/).
