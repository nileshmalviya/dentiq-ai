import { createResourceService } from './resource.service';
export const billingService = createResourceService(["/admin/billing", "/doctor/billing"]);
