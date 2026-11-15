import { createResourceService } from './resource.service';
export const analyticsService = createResourceService(["/admin/analytics", "/doctor/analytics"]);
