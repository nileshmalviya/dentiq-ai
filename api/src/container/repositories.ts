import {DoctorRepository} from '../repositories/doctor.repository.js';
import { models } from '../models/resource.model.js';
import { MongoRepository, MongoUnitOfWork } from '../repositories/resource.repository.js';
import { InventoryRepository } from '../repositories/inventory.repository.js';
import { AppointmentRepository } from '../repositories/appointment.repository.js';
import type { Resource } from '../validations/resource.validation.js';
const inventory = new InventoryRepository(), appointments = new AppointmentRepository();
export const repositories = Object.fromEntries(Object.keys(models).map(name => [name, name === 'doctors' ? new DoctorRepository() : name === 'inventory' ? inventory : name === 'appointments' ? appointments : new MongoRepository(name as Resource)])) as Record<Resource, MongoRepository>;
export const work = new MongoUnitOfWork(inventory, appointments);
