import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

// A fake PrismaService: every database method is a vi.fn() the test
// controls. No real database is touched.
function makePrismaMock() {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    role: { findUnique: vi.fn() },
    provider: { findUnique: vi.fn(), update: vi.fn() },
  };
}

const roleRow = { id: 'role-provider', role: 'provider', status: 'ACTIVE' };

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'Rafiq Ahmed',
    phone: '0300-2222222',
    password: 'hashed',
    roleId: 'role-provider',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    role: roleRow,
    provider: { id: 'provider-1', userId: 'user-1', profilePic: '' },
    ...overrides,
  };
}

describe('UsersService', () => {
  it('register: rejects a phone number that is already taken', async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(userRow());
    const service = new UsersService(prisma as unknown as PrismaService);

    await expect(
      service.register({ name: 'New', phone: '0300-2222222', password: 'secret1', role: 'seeker' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('register: creates the user and a provider row, without the password in the result', async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.role.findUnique.mockResolvedValue(roleRow);
    prisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      userRow({ name: data.name, phone: data.phone, password: data.password }),
    );
    const service = new UsersService(prisma as unknown as PrismaService);

    const created = await service.register({
      name: 'Rafiq Ahmed',
      phone: '0300-2222222',
      password: 'secret1',
      role: 'provider',
    });

    expect(created).not.toHaveProperty('password');
    expect(created.role).toBe('provider');
    expect(prisma.user.create).toHaveBeenCalledOnce();
    const createArg = prisma.user.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(createArg.data.provider).toBeDefined();
  });

  it('login: rejects a wrong password', async () => {
    const prisma = makePrismaMock();
    const hash = await bcrypt.hash('correct-password', 10);
    prisma.user.findUnique.mockResolvedValue(userRow({ password: hash }));
    const service = new UsersService(prisma as unknown as PrismaService);

    await expect(
      service.login({ phone: '0300-2222222', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login: returns the user for the right password', async () => {
    const prisma = makePrismaMock();
    const hash = await bcrypt.hash('correct-password', 10);
    prisma.user.findUnique.mockResolvedValue(userRow({ password: hash }));
    const service = new UsersService(prisma as unknown as PrismaService);

    const loggedIn = await service.login({ phone: '0300-2222222', password: 'correct-password' });

    expect(loggedIn.name).toBe('Rafiq Ahmed');
    expect(loggedIn).not.toHaveProperty('password');
    expect(loggedIn.providerId).toBe('provider-1');
  });

  it('login: returns a null providerId for a seeker with no provider row', async () => {
    const prisma = makePrismaMock();
    const hash = await bcrypt.hash('correct-password', 10);
    prisma.user.findUnique.mockResolvedValue(
      userRow({ password: hash, role: { id: 'role-seeker', role: 'seeker', status: 'ACTIVE' }, provider: null }),
    );
    const service = new UsersService(prisma as unknown as PrismaService);

    const loggedIn = await service.login({ phone: '0300-1111111', password: 'correct-password' });

    expect(loggedIn.providerId).toBeNull();
  });

  it('update: rejects an unknown user and a phone taken by someone else', async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(null);
    const service = new UsersService(prisma as unknown as PrismaService);

    await expect(service.update('missing', { name: 'New' })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.user.findUnique
      .mockResolvedValueOnce(userRow())
      .mockResolvedValueOnce(userRow({ id: 'user-2', phone: '0300-3333333' }));
    await expect(service.update('user-1', { phone: '0300-3333333' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
