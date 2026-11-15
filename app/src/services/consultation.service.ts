import { createResourceService } from './resource.service';
export const consultationService = createResourceService(["/admin/consultations", "/doctor/consultations"]);
