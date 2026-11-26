import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

// A fake PrismaService: every database method is a vi.fn() the test
// controls. No real database is touched.
function makePrismaMock() {
  return {
    user: { findUnique: vi.fn() },
    provider: { findUnique: vi.fn() },
    service: { findMany: vi.fn() },
    serviceCategory: { findUnique: vi.fn() },
    job: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    bid: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  };
}

const categoryRow = { id: 'cat-1', slug: 'electrician', name: 'Electrician' };

function jobRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'job-1',
    seekerId: 'user-1',
    categoryId: 'cat-1',
    title: 'Fan not working',
    description: 'Ceiling fan stopped.',
    address: 'Depalpur',
    latitude: 30.66,
    longitude: 73.65,
    status: 'PENDING',
    requestedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    seeker: { id: 'user-1', name: 'Ayesha', phone: '0300-1111111' },
    category: categoryRow,
    ...overrides,
  };
}

function seekerUser(role: string) {
  return {
    id: 'user-1',
    name: 'Ayesha',
    phone: '0300-1111111',
    password: 'hashed',
    roleId: 'role-seeker',
    role: { id: 'role-seeker', role, status: 'ACTIVE' },
  };
}

describe('JobsService', () => {
  it('create: rejects a user who is not a seeker', async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(seekerUser('provider'));
    const service = new JobsService(prisma as unknown as PrismaService);

    await expect(
      service.create({ seekerId: 'user-1', categoryId: 'cat-1', title: 'Fix fan' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('create: rejects an unknown seeker and an unknown category', async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(null);
    const service = new JobsService(prisma as unknown as PrismaService);

    await expect(
      service.create({ seekerId: 'missing', categoryId: 'cat-1', title: 'Fix fan' }),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.user.findUnique.mockResolvedValue(seekerUser('seeker'));
    prisma.serviceCategory.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ seekerId: 'user-1', categoryId: 'missing', title: 'Fix fan' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create: creates a pending job with the seeker and category attached', async () => {
    const prisma = makePrismaMock();
    prisma.user.findUnique.mockResolvedValue(seekerUser('seeker'));
    prisma.serviceCategory.findUnique.mockResolvedValue(categoryRow);
    prisma.job.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      jobRow({ title: data.title }),
    );
    const service = new JobsService(prisma as unknown as PrismaService);

    const created = await service.create({
      seekerId: 'user-1',
      categoryId: 'cat-1',
      title: 'Fix fan',
    });

    expect(created.status).toBe('PENDING');
    expect(created.seeker.name).toBe('Ayesha');
    expect(created.category.slug).toBe('electrician');
  });

  it('findAll: with providerId, only returns jobs in categories the provider offers', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue({ id: 'provider-1' });
    prisma.service.findMany.mockResolvedValue([{ categoryId: 'cat-1' }]);
    prisma.job.findMany.mockResolvedValue([jobRow()]);
    const service = new JobsService(prisma as unknown as PrismaService);

    const jobs = await service.findAll({ providerId: 'provider-1' });

    expect(jobs).toHaveLength(1);
    const where = prisma.job.findMany.mock.calls[0][0].where as Record<string, unknown>;
    expect(where.categoryId).toEqual({ in: ['cat-1'] });
  });

  it('findAll: with providerId, returns nothing when the provider has no services', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue({ id: 'provider-1' });
    prisma.service.findMany.mockResolvedValue([]);
    const service = new JobsService(prisma as unknown as PrismaService);

    const jobs = await service.findAll({ providerId: 'provider-1' });

    expect(jobs).toEqual([]);
    expect(prisma.job.findMany).not.toHaveBeenCalled();
  });

  it('findAll: with providerId, rejects an unknown provider and an unmatched category', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue(null);
    const service = new JobsService(prisma as unknown as PrismaService);

    await expect(service.findAll({ providerId: 'missing' })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.provider.findUnique.mockResolvedValue({ id: 'provider-1' });
    prisma.service.findMany.mockResolvedValue([{ categoryId: 'cat-1' }]);
    const jobs = await service.findAll({ providerId: 'provider-1', categoryId: 'cat-2' });
    expect(jobs).toEqual([]);
  });

  it('update: rejects edits to a job that is no longer pending', async () => {
    const prisma = makePrismaMock();
    prisma.job.findUnique.mockResolvedValue(jobRow({ status: 'AWARDED' }));
    const service = new JobsService(prisma as unknown as PrismaService);

    await expect(service.update('job-1', { title: 'New title' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('award: awards the job, accepts the picked bid, rejects the rest', async () => {
    const prisma = makePrismaMock();
    prisma.job.findUnique.mockResolvedValue(jobRow());
    prisma.bid.findUnique.mockResolvedValue({ id: 'bid-1', jobId: 'job-1', status: 'PENDING' });
    prisma.job.update.mockResolvedValue(jobRow({ status: 'AWARDED' }));
    prisma.bid.update.mockResolvedValue({ id: 'bid-1', status: 'ACCEPTED' });
    prisma.bid.updateMany.mockResolvedValue({ count: 1 });
    prisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) => cb(prisma));
    const service = new JobsService(prisma as unknown as PrismaService);

    const awarded = await service.award('job-1', { bidId: 'bid-1' });

    expect(awarded.status).toBe('AWARDED');
    expect(prisma.bid.update).toHaveBeenCalledWith({
      where: { id: 'bid-1' },
      data: { status: 'ACCEPTED' },
    });
    expect(prisma.bid.updateMany).toHaveBeenCalledWith({
      where: { jobId: 'job-1', status: 'PENDING', id: { not: 'bid-1' } },
      data: { status: 'REJECTED' },
    });
  });

  it('award: rejects a non-pending job and a bid from another job', async () => {
    const prisma = makePrismaMock();
    prisma.job.findUnique.mockResolvedValue(jobRow({ status: 'CANCELLED' }));
    const service = new JobsService(prisma as unknown as PrismaService);

    await expect(service.award('job-1', { bidId: 'bid-1' })).rejects.toBeInstanceOf(
      ConflictException,
    );

    prisma.job.findUnique.mockResolvedValue(jobRow());
    prisma.bid.findUnique.mockResolvedValue({ id: 'bid-9', jobId: 'job-2', status: 'PENDING' });
    await expect(service.award('job-1', { bidId: 'bid-9' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('cancel and complete: enforce the state guards', async () => {
    const prisma = makePrismaMock();
    prisma.job.findUnique.mockResolvedValue(jobRow());
    prisma.job.update.mockResolvedValue(jobRow({ status: 'CANCELLED' }));
    const service = new JobsService(prisma as unknown as PrismaService);

    const cancelled = await service.cancel('job-1');
    expect(cancelled.status).toBe('CANCELLED');

    await expect(service.complete('job-1')).rejects.toBeInstanceOf(ConflictException);

    prisma.job.findUnique.mockResolvedValue(jobRow({ status: 'AWARDED' }));
    prisma.job.update.mockResolvedValue(jobRow({ status: 'COMPLETED' }));
    const completed = await service.complete('job-1');
    expect(completed.status).toBe('COMPLETED');

    prisma.job.findUnique.mockResolvedValue(jobRow({ status: 'COMPLETED' }));
    await expect(service.cancel('job-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('remove: rejects deleting a job that is no longer pending', async () => {
    const prisma = makePrismaMock();
    prisma.job.findUnique.mockResolvedValue(jobRow({ status: 'AWARDED' }));
    const service = new JobsService(prisma as unknown as PrismaService);

    await expect(service.remove('job-1')).rejects.toBeInstanceOf(ConflictException);
  });
});
