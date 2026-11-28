import { z } from 'zod';

export const listBookingsSchema = z.object({
  seekerId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED']).optional(),
});

export type ListBookingsQuery = z.infer<typeof listBookingsSchema>;
