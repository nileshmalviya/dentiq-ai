import type { Router, RequestHandler } from 'express';
import type { Dependencies } from '../container/dependencies.js';
import { identity, validate } from '../middleware/index.js';
import { httpSchemas } from '../validations/http.validation.js';
export function registerChatRoutes(router: Router, d: Dependencies, authLimit: RequestHandler, publicLimit: RequestHandler) {
    const { controllers: c, auth } = d;
    router.post('/recommendations/doctors', publicLimit, identity(auth, false), validate(httpSchemas.recommendation), c.recommendations.getDoctors);
    router.post('/ai-chat/message', publicLimit, identity(auth, false), validate(httpSchemas.chatMessage), c.chat.message);
    router.get('/ai-chat/conversations/:id', publicLimit, identity(auth, false), c.chat.conversation);
}
