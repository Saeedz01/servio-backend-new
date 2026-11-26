import { z } from 'zod';

// What a client must send to post a job. Only the seeker, the
// category and the title are required; everything else falls back to
// the defaults in the service layer (see jobs.service.ts).
// requestedAt is when the seeker wants the work done; when it is not
// sent, the job is requested for right now.
export const createJobSchema = z.object({
  seekerId: z.string().uuid('seekerId must be a UUID.'),
  categoryId: z.string().uuid('categoryId must be a UUID.'),
  title: z.string().trim().min(1, 'Title is required.'),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  requestedAt: z.coerce.date().optional(),
});

export type CreateJobDto = z.infer<typeof createJobSchema>;
