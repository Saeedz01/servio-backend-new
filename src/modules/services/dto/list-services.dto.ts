import { z } from 'zod';

// Optional filters for GET /services. All of them arrive as query
// strings, so they are all optional here.
export const listServicesSchema = z.object({
  providerId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  serviceAreaId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).optional(),
});

export type ListServicesQuery = z.infer<typeof listServicesSchema>;
