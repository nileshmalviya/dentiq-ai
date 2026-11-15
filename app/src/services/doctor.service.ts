import { createResourceService } from './resource.service';
export const doctorService = createResourceService(["/admin/doctors", "/public/doctors"]);
