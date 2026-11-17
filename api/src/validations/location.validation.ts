import { z } from 'zod';

export const geoPointSchema = z.object({
  type: z.enum(['Point']),
  coordinates: z.array(z.number().finite()).length(2).refine(
    ([longitude, latitude]) => longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90,
    'Invalid clinic coordinates',
  ),
}).strict();
export const confirmedClinicLocationSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  confirmed: z.boolean().refine(value => value, 'Confirm that this is the clinic location'),
}).strict();
export const updateClinicLocationSchema = confirmedClinicLocationSchema.extend({
  address: z.string().trim().min(1).max(4000), city: z.string().trim().min(1).max(200),
  state: z.string().trim().min(1).max(200), postalCode: z.string().trim().min(1).max(30),
}).strict();
const numericQuery = (minimum: number, maximum: number) => z.string().trim().min(1)
  .refine(value => Number.isFinite(Number(value)), 'Invalid search value')
  .transform(Number).pipe(z.number().finite().min(minimum).max(maximum));
export const doctorSearchQuerySchema = z.object({
  latitude: numericQuery(-90, 90).optional(), longitude: numericQuery(-180, 180).optional(),
  radiusKm: numericQuery(0.1, 500).default('20'),
  page: numericQuery(1, 10000).pipe(z.number().int()).default('1'),
  limit: numericQuery(1, 50).pipe(z.number().int()).default('10'),
  specialization: z.string().trim().max(200).default(''),
  search: z.string().trim().max(200).default(''),
  city: z.string().trim().max(200).default(''),
  concern: z.string().trim().max(4000).default(''),
  sort: z.enum(['distance', 'rating', 'experience']).default('distance'),
}).strict().refine(value =>
  (value.latitude !== undefined && value.longitude !== undefined && !value.city) ||
  (value.latitude === undefined && value.longitude === undefined && Boolean(value.city)),
  'Provide coordinates or a city',
);
export type DoctorSearchQuery = z.infer<typeof doctorSearchQuerySchema>;
