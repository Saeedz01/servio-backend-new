import { z } from 'zod';

export const createBookingSchema = z.object({
  seekerId: z.string().uuid('seekerId must be a UUID.'),
  serviceId: z.string().uuid('serviceId must be a UUID.'),
  address: z.string().trim().min(1, 'Address is required.'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  note: z.string().optional(),
  neededAt: z.coerce.date(),
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
