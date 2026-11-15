import type { Router, RequestHandler } from 'express';
import type { Dependencies } from '../container/dependencies.js';
import { identity, authorize, validate } from '../middleware/index.js';
import { httpSchemas } from '../validations/http.validation.js';
export function registerInventoryRoutes(router: Router, d: Dependencies, authLimit: RequestHandler, publicLimit: RequestHandler) {
    const { controllers: c, auth } = d;
    const staff = [identity(auth), authorize('SUPER_ADMIN', 'DOCTOR')];
    router.get('/inventory/summary', ...staff, c.inventory.summary);
    router.get('/inventory/transactions', ...staff, c.resource('inventory-transactions').list(false));
    for (const route of ['', '/low-stock', '/expiring-soon'] as const)
        router.get(`/inventory${route}`, ...staff, c.inventory.filteredList(route));
    router.post('/inventory', ...staff, validate(httpSchemas.createInventory), c.inventory.create);
    router.get('/inventory/:id', ...staff, c.inventory.get);
    router.patch('/inventory/:id', ...staff, validate(httpSchemas.updateInventory), c.inventory.update);
    router.delete('/inventory/:id', ...staff, c.inventory.remove);
    for (const direction of ['in', 'out'] as const)
        router.post(`/inventory/:id/stock-${direction}`, ...staff, validate(httpSchemas.stockMovement), c.inventory.adjust(direction));
}
