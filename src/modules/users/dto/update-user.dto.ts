import { z } from 'zod';

// Partial update: every field is optional, only the fields that are
// sent are changed. The role cannot be changed here.
export const updateUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').optional(),
  phone: z.string().trim().min(7, 'Phone number looks too short.').max(20).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  profilePic: z.string().optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
