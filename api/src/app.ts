import type {Dependencies} from './container/dependencies.js';
import openapi from '../openapi.json' with { type: 'json' };
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { Env } from './config/env.js';
import { createRoutes } from './routes/index.js';
import { errorHandler } from './middleware/index.js';
export function createApp(env: Env, dependencies?:Dependencies) {
    const app = express();
    app.disable('x-powered-by');
    app.use(helmet());
    app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
    app.use(express.json({ limit: '100kb' }));
    app.use(cookieParser());
    app.use((req, res, next) => {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin && req.headers.origin !== env.CLIENT_URL) {
            res.status(403).json({ success: false, message: 'Origin not allowed', errors: [] });
            return;
        }
        next();
    });
    app.get('/api-docs', (_req, res) => res.json(openapi));
    app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
    app.use('/api/v1', createRoutes(env,dependencies));
    app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found', errors: [] }));
    app.use(errorHandler);
    return app;
}
