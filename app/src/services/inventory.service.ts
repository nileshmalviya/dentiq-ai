import { createResourceService } from './resource.service';
import { write } from './apiClient';
export const inventoryService = { ...createResourceService(['/inventory']),
    saveItem<T>(id: string | undefined, data: unknown) { return write<T>(id ? `/inventory/${id}` : '/inventory', id ? 'PATCH' : 'POST', data); },
    stockMovement<T>(id: string, direction: 'in' | 'out', amount: number, reason = '') { return write<T>(`/inventory/${id}/stock-${direction}`, 'POST', { amount, reason }); },
    deleteItem<T>(id: string) { return write<T>(`/inventory/${id}`, 'DELETE'); }
};
