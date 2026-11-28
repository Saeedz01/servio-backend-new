import { z } from 'zod';

export const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED']).optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  neededAt: z.coerce.date().optional(),
});

export type UpdateBookingDto = z.infer<typeof updateBookingSchema>;
