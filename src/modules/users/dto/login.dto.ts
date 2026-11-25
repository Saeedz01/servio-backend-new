import { z } from 'zod';

// Phone + password login. There is no real OTP system and no JWT yet:
// a correct phone/password pair returns the user, anything else is a 401.
export const loginSchema = z.object({
  phone: z.string().trim().min(1, 'Phone number is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginDto = z.infer<typeof loginSchema>;
