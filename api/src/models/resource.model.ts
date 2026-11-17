import { geoPointSchema } from '../validations/location.validation.js';
import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
import { definitions, type Resource } from '../validations/resource.validation.js';
function field(type: z.ZodTypeAny): any {
    if (type instanceof z.ZodEffects)
        return field(type._def.schema);
    if (type instanceof z.ZodDefault)
        return { ...field(type._def.innerType), required: false, default: () => type._def.defaultValue() };
    if (type instanceof z.ZodOptional || type instanceof z.ZodNullable)
        return { ...field(type._def.innerType), required: false };
    if (type instanceof z.ZodString || type instanceof z.ZodEnum)
        return { type: String, required: true, ...(type instanceof z.ZodEnum ? { enum: type.options } : {}) };
    if (type instanceof z.ZodNumber)
        return { type: Number, required: true, validate: (value: number) => type.safeParse(value).success };
    if (type instanceof z.ZodBoolean)
        return { type: Boolean, required: true };
    if (type instanceof z.ZodDate)
        return { type: Date, required: true };
    if (type instanceof z.ZodArray)
        return { type: [field(type.element)], default: [] };
    if (type instanceof z.ZodObject)
        return { type: new Schema(Object.fromEntries(Object.entries(type.shape).map(([k, v]) => [k, field(v as z.ZodTypeAny)])), { _id: false }), required: true };
    throw new Error('Unsupported schema field');
}
export const models = Object.fromEntries(Object.entries(definitions).map(([name, definition]) => {
    const shape: Record<string, any> = { id: { type: String, required: true, unique: true } };
    for (const [key, type] of Object.entries(definition.shape))
        shape[key] = field(type as z.ZodTypeAny);
    for (const key of ['doctorId', 'patientId', 'clinicId', 'userId', 'conversationId', 'invoiceId', 'inventoryId'])
        if (shape[key] && !(name==='doctor-registrations'&&['userId','doctorId'].includes(key)) && !(name==='email-verifications'&&key==='userId'))
            shape[key] = { ...shape[key], index: true };
    const schema = new Schema(shape, { timestamps: true, strict: 'throw', versionKey: false });
    const references: Record<string, string> = { doctorId: 'doctors', patientId: 'patients', clinicId: 'clinics', userId: 'users', conversationId: 'conversations', invoiceId: 'billing', inventoryId: 'inventory' };
    for (const [key, ref] of Object.entries(references))
        if (shape[key])
            schema.virtual(key.replace('Id', 'Record'), { ref, localField: key, foreignField: 'id', justOne: true });
    if (name === 'clinics') {
        schema.path('location').validate((value: any) => value == null || geoPointSchema.safeParse(value.toObject ? value.toObject() : value).success, 'Invalid clinic coordinates');
        schema.index({ location: '2dsphere' });
    }
    if (name === 'users')
        schema.index({ email: 1 }, { unique: true });
    if (name === 'doctors') schema.index({ status: 1, approvalStatus: 1 });
    if (name === 'doctors')
        schema.index({ email: 1 }, { unique: true });
    if (name === 'appointments') {
        schema.index({ doctorId: 1, startTime: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['Scheduled', 'Confirmed', 'Checked In', 'In Progress', 'Completed'] } } });
        schema.index({ doctorId: 1, appointmentDate: 1 });
        schema.index({ patientId: 1, appointmentDate: -1 });
    }
    if (name === 'inventory')
        schema.index({ clinicId: 1, sku: 1 }, { unique: true, partialFilterExpression: { sku: { $type: 'string' } } });
    if (name === 'sessions') {
        schema.index({ tokenHash: 1 }, { unique: true });
        schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    }
    if(name==='doctors')schema.index({registrationCouncil:1,registrationState:1,registrationNumber:1},{unique:true,partialFilterExpression:{registrationManaged:true}});
    if(name==='doctor-registrations'){schema.index({userId:1},{unique:true});schema.index({doctorId:1},{unique:true});schema.index({requestStatus:1,createdAt:-1});}
    if(name==='email-verifications'){schema.index({userId:1},{unique:true});schema.index({expiresAt:1},{expireAfterSeconds:0});}
    if(name==='doctor-clinics'){schema.index({doctorId:1,clinicId:1},{unique:true});schema.index({clinicId:1,status:1});}
    if(name==='documents')schema.index({registrationId:1,active:1});
    if(name==='doctor-approval-audits')schema.index({registrationId:1,createdAt:1});
    if (name === 'messages')
        schema.index({ conversationId: 1, createdAt: 1 });
    return [name, mongoose.models[name] || mongoose.model(name, schema, name)];
})) as Record<Resource, mongoose.Model<any>>;
