import { z } from 'zod';

// What a client must send to create a service. Only providerId,
// categoryId, serviceAreaId and title are required; everything else
// falls back to the defaults in the service layer (see services.service.ts).
export const createServiceSchema = z.object({
  providerId: z.string().uuid('providerId must be a UUID.'),
  title: z.string().trim().min(1, 'Title is required.'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radiusKm: z.number().positive().optional(),
  priceAmount: z.number().min(0).optional(),
  priceUnit: z.enum(['PER_VISIT', 'PER_HOUR', 'FIXED']).optional(),
  availability: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).optional(),
  categoryId: z.string().uuid('categoryId must be a UUID.'),
  specialty: z.array(z.string()).optional(),
  serviceAreaId: z.string().uuid('serviceAreaId must be a UUID.'),
  experience: z.number().min(0).optional(),
  visitCharges: z.number().min(0).optional(),
});

export type CreateServiceDto = z.infer<typeof createServiceSchema>;
