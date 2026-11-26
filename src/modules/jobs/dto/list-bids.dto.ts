import { z } from 'zod';

// Optional filters for GET /bids. All of them arrive as query
// strings, so they are all optional here.
export const listBidsSchema = z.object({
  jobId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']).optional(),
});

export type ListBidsQuery = z.infer<typeof listBidsSchema>;
