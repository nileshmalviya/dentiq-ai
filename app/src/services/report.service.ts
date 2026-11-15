import { createResourceService } from './resource.service';
export const reportService = createResourceService(["/admin/reports", "/doctor/reports"]);
