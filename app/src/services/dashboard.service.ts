import { createResourceService } from './resource.service';
export const dashboardService = createResourceService(["/admin/dashboard", "/doctor/dashboard"]);
