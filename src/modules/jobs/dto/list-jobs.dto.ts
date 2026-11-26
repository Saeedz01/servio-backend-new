import { z } from 'zod';

// Optional filters for GET /jobs. All of them arrive as query
// strings, so they are all optional here. providerId is the
// relevance filter: only jobs in categories the provider offers
// services in are returned (see jobs.service.ts).
export const listJobsSchema = z.object({
  seekerId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'AWARDED', 'CANCELLED', 'COMPLETED']).optional(),
  providerId: z.string().uuid().optional(),
});

export type ListJobsQuery = z.infer<typeof listJobsSchema>;
