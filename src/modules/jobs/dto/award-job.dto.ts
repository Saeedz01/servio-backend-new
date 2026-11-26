import { z } from 'zod';

// The body for POST /jobs/:id/award: the bid the seeker picked.
export const awardJobSchema = z.object({
  bidId: z.string().uuid('bidId must be a UUID.'),
});

export type AwardJobDto = z.infer<typeof awardJobSchema>;
