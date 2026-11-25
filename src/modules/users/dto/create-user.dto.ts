import { z } from 'zod';

// What a client must send to register a user. The role is given by its
// name ("admin", "provider" or "seeker") and defaults to "seeker".
// profilePic is only used when the role is "provider": it is stored on
// the provider row that is created together with the user.
export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  phone: z.string().trim().min(7, 'Phone number looks too short.').max(20),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['admin', 'provider', 'seeker']).default('seeker'),
  profilePic: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
