import type { Router, RequestHandler } from 'express';
import type { Dependencies } from '../container/dependencies.js';

export function registerSocialAuthRoutes(router: Router, d: Dependencies, limit: RequestHandler) {
  router.get('/auth/social/providers', limit, d.controllers.socialAuth.availability);
  router.post('/auth/social/:provider/start', limit, d.controllers.socialAuth.start);
  router.get('/auth/social/:provider/callback', limit, d.controllers.socialAuth.callback);
}
