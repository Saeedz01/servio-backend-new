import { z } from 'zod';
import { createBidSchema } from './create-bid.dto.js';

// Partial update: only the price, note and visit fee can change, and
// only while the bid is still pending. The provider and the job never
// change, and the status is changed through the withdraw endpoint,
// or by the seeker awarding the job.
export const updateBidSchema = createBidSchema.omit({ providerId: true, jobId: true }).partial();

export type UpdateBidDto = z.infer<typeof updateBidSchema>;
