import { z } from 'zod';
import { createJobSchema } from './create-job.dto.js';

// Partial update: every field is optional, only the fields that are
// sent are changed. The seeker who posted a job never changes, and
// the status is changed through the award/cancel/complete endpoints,
// not here.
export const updateJobSchema = createJobSchema.omit({ seekerId: true }).partial();

export type UpdateJobDto = z.infer<typeof updateJobSchema>;
