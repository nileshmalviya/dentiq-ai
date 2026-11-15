import { inventoryService } from './inventory.service';
import { appointmentService } from './appointment.service';
import { patientService } from './patient.service';
import { userService } from './user.service';
import { recommendationService } from './recommendation.service';
import { aiChatService } from './aiChat.service';
import { doctorService } from './doctor.service';
import { clinicService } from './clinic.service';
import { clinicalNoteService } from './clinicalNote.service';
import { consultationService } from './consultation.service';
import { treatmentPlanService } from './treatmentPlan.service';
import { billingService } from './billing.service';
import { dashboardService } from './dashboard.service';
import { analyticsService } from './analytics.service';
import { reportService } from './report.service';
import { dentalServiceService } from './dentalService.service';
const services = [inventoryService, appointmentService, patientService, userService, recommendationService, aiChatService, doctorService, clinicService, clinicalNoteService, consultationService, treatmentPlanService, billingService, dashboardService, analyticsService, reportService, dentalServiceService];
function resolveService(endpoint: string) { const path = endpoint.split('?')[0]; const service = services.find(service => service.prefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'))); if (!service)
    throw new Error('No frontend service registered for ' + path); return service; }
export function readResource<T>(endpoint: string, query?: string) { return resolveService(endpoint).read<T>(endpoint, query); }
export async function persistResourceRows<T extends {
    id: string;
}>(endpoint: string, previous: T[], next: T[]) {
    const service = resolveService(endpoint);
    for (const row of next) {
        const old = previous.find(item => item.id === row.id);
        if (!old) {
            const { id, ...data } = row;
            void id;
            await service.create(endpoint, data);
        }
        else {
            const changes = Object.fromEntries(Object.entries(row).filter(([key, value]) => key !== 'id' && JSON.stringify(value) !== JSON.stringify((old as Record<string, unknown>)[key])));
            if (Object.keys(changes).length)
                await service.update(endpoint + '/' + row.id, changes);
        }
    }
    for (const old of previous)
        if (!next.some(row => row.id === old.id))
            await service.remove(endpoint + '/' + old.id);
}
