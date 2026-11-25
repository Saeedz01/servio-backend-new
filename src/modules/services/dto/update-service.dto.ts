import { z } from 'zod';
import { createServiceSchema } from './create-service.dto.js';

// Partial update: every field is optional, only the fields that are
// sent are changed. The provider of a service never changes.
export const updateServiceSchema = createServiceSchema.omit({ providerId: true }).partial();

export type UpdateServiceDto = z.infer<typeof updateServiceSchema>;
