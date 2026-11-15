import mongoose from 'mongoose';
import type { Criteria, Row } from '../types/index.js';
import { models } from '../models/resource.model.js';
import { MongoRepository, clean } from './mongo.repository.js';
export class AppointmentRepository extends MongoRepository {
    constructor() { super('appointments'); }
    async book(appointment: Row, patient: Row | undefined, patientId: string) {
        return mongoose.connection.transaction(async (session) => {
            if (patient)
                await models.patients.create([patient], { session });
            await models.patients.updateOne({ id: patientId }, { $addToSet: { doctorIds: appointment.doctorId } }, { session });
            return clean((await models.appointments.create([appointment], { session }))[0]);
        });
    }
    async transition(id: string, from: string, status: string, scope: Criteria) { const row = await models.appointments.findOneAndUpdate({ $and: [scope, { id, status: from }] }, { $set: { status } }, { new: true, runValidators: true }).lean(); return row ? clean(row) : null; }
}
