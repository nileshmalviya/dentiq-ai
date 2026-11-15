import { createResourceService } from './resource.service';
export const clinicalNoteService = createResourceService(["/admin/clinical-notes", "/doctor/clinical-notes"]);
