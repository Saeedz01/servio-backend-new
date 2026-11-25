import type { Provider, Role, User, UserStatus } from '@prisma/client';

// What the API returns for a user. The password hash is NEVER included.
export interface UserEntity {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: UserStatus;
  profilePic: string | null;
  // Id of the provider row for provider users, so the frontend can
  // create and manage that provider's services. Null otherwise.
  providerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type UserRow = User & { role: Role; provider: Provider | null };

// Converts a database row (with its role and provider loaded) into the
// shape the API returns.
export function toUserEntity(user: UserRow): UserEntity {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role.role,
    status: user.status,
    profilePic: user.provider?.profilePic ?? null,
    providerId: user.provider?.id ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
