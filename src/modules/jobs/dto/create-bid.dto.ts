import { z } from 'zod';

// What a client must send to bid on a job. Only the provider and the
// job are required; price and visit fee default to 0 and the note to
// an empty string.
export const createBidSchema = z.object({
  providerId: z.string().uuid('providerId must be a UUID.'),
  jobId: z.string().uuid('jobId must be a UUID.'),
  price: z.number().min(0, 'Price cannot be negative.').optional(),
  note: z.string().optional(),
  visitFee: z.number().min(0, 'Visit fee cannot be negative.').optional(),
});

export type CreateBidDto = z.infer<typeof createBidSchema>;
