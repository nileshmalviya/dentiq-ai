import { createApp } from './app.js';
import { readEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { ensureIndexes } from './repositories/resource.repository.js';
async function main() {
    const env = readEnv();
    await connectDatabase(env.MONGODB_URI);
    await ensureIndexes();
    const server = createApp(env).listen(env.PORT, () => console.log(`Dentiq API listening on port ${env.PORT}`));
    let closing = false;
    const shutdown = () => {
        if (closing)
            return;
        closing = true;
        server.close(() => { disconnectDatabase().finally(() => process.exit(0)); });
        setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
main().catch(() => { console.error('API startup failed. Check environment, database connectivity, and index conflicts. No credentials are logged.'); process.exitCode = 1; });
