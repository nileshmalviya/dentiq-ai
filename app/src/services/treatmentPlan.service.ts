import { createResourceService } from './resource.service';
export const treatmentPlanService = createResourceService(["/admin/treatment-plans", "/doctor/treatment-plans"]);
