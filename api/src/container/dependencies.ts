import { RecommendationService } from '../services/recommendation.service.js';
import { RecommendationController } from '../controllers/recommendation.controller.js';
import type { Env } from '../config/env.js';
import { repositories, work } from './repositories.js';
import { ResourceService } from '../services/resource.service.js';
import { AuthService } from '../services/auth.service.js';
import { AppointmentService } from '../services/appointment.service.js';
import { InventoryService } from '../services/inventory.service.js';
import { PatientService } from '../services/patient.service.js';
import { PublicService } from '../services/public.service.js';
import { DashboardService } from '../services/dashboard.service.js';
import { ChatService } from '../services/aiChat.service.js';
import type { Resource } from '../validations/resource.validation.js';
import { AuthController } from '../controllers/auth.controller.js';
import { ResourceController } from '../controllers/resource.controller.js';
import { AppointmentController } from '../controllers/appointment.controller.js';
import { InventoryController } from '../controllers/inventory.controller.js';
import { PatientController } from '../controllers/patient.controller.js';
import { PublicController } from '../controllers/public.controller.js';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { ChatController } from '../controllers/aiChat.controller.js';
export function createDependencies(env: Env) {
    const recommendations = new RecommendationService(repositories);
    const auth = new AuthService(repositories, work, env);
    const appointments = new AppointmentService('appointments', repositories, work), inventory = new InventoryService('inventory', repositories, work), patients = new PatientService('patients', repositories, work);
    const resources = new Map<Resource, ResourceService>([['appointments', appointments], ['inventory', inventory], ['patients', patients]]);
    const resource = (name: Resource) => { let service = resources.get(name); if (!service) {
        service = new ResourceService(name, repositories, work);
        resources.set(name, service);
    } return new ResourceController(service); };
    return { env, auth, controllers: { auth: new AuthController(auth, env), user: resource('users'), resource, appointments: new AppointmentController(appointments), inventory: new InventoryController(inventory), patients: new PatientController(patients), public: new PublicController(new PublicService(repositories)), dashboard: new DashboardController(new DashboardService(repositories)), chat: new ChatController(new ChatService(repositories, recommendations), env), recommendations: new RecommendationController(recommendations, env) } };
}
export type Dependencies = ReturnType<typeof createDependencies>;
