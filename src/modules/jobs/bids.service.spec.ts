import { ConflictException, NotFoundException } from '@nestjs/common';
import { BidsService } from './bids.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

// A fake PrismaService: every database method is a vi.fn() the test
// controls. No real database is touched.
function makePrismaMock() {
  return {
    provider: { findUnique: vi.fn() },
    job: { findUnique: vi.fn() },
    bid: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

function bidRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bid-1',
    providerId: 'provider-1',
    jobId: 'job-1',
    price: 1500,
    note: 'Can come tomorrow.',
    visitFee: 200,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    provider: {
      id: 'provider-1',
      profilePic: '',
      user: { name: 'Rafiq Ahmed' },
    },
    ...overrides,
  };
}

function pendingJob() {
  return { id: 'job-1', status: 'PENDING' };
}

describe('BidsService', () => {
  it('create: rejects an unknown provider and an unknown job', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue(null);
    const service = new BidsService(prisma as unknown as PrismaService);

    await expect(
      service.create({ providerId: 'missing', jobId: 'job-1', price: 100 }),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.provider.findUnique.mockResolvedValue({ id: 'provider-1' });
    prisma.job.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ providerId: 'provider-1', jobId: 'missing', price: 100 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create: rejects a bid on a job that is no longer pending', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue({ id: 'provider-1' });
    prisma.job.findUnique.mockResolvedValue({ id: 'job-1', status: 'AWARDED' });
    const service = new BidsService(prisma as unknown as PrismaService);

    await expect(
      service.create({ providerId: 'provider-1', jobId: 'job-1', price: 100 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('create: rejects a second bid from the same provider on the same job', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue({ id: 'provider-1' });
    prisma.job.findUnique.mockResolvedValue(pendingJob());
    prisma.bid.findUnique.mockResolvedValue(bidRow());
    const service = new BidsService(prisma as unknown as PrismaService);

    await expect(
      service.create({ providerId: 'provider-1', jobId: 'job-1', price: 100 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('create: creates a pending bid showing the provider name', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue({ id: 'provider-1' });
    prisma.job.findUnique.mockResolvedValue(pendingJob());
    prisma.bid.findUnique.mockResolvedValue(null);
    prisma.bid.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
      bidRow({ price: data.price }),
    );
    const service = new BidsService(prisma as unknown as PrismaService);

    const created = await service.create({ providerId: 'provider-1', jobId: 'job-1', price: 1200 });

    expect(created.status).toBe('PENDING');
    expect(created.price).toBe(1200);
    expect(created.provider.name).toBe('Rafiq Ahmed');
  });

  it('findAll: rejects an unknown job filter', async () => {
    const prisma = makePrismaMock();
    prisma.job.findUnique.mockResolvedValue(null);
    const service = new BidsService(prisma as unknown as PrismaService);

    await expect(service.findAll({ jobId: 'missing' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update and withdraw: only pending bids can change', async () => {
    const prisma = makePrismaMock();
    prisma.bid.findUnique.mockResolvedValue(bidRow({ status: 'ACCEPTED' }));
    const service = new BidsService(prisma as unknown as PrismaService);

    await expect(service.update('bid-1', { price: 900 })).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.withdraw('bid-1')).rejects.toBeInstanceOf(ConflictException);
    await expect(service.remove('bid-1')).rejects.toBeInstanceOf(ConflictException);

    prisma.bid.findUnique.mockResolvedValue(bidRow());
    prisma.bid.update.mockResolvedValue(bidRow({ status: 'WITHDRAWN' }));
    const withdrawn = await service.withdraw('bid-1');
    expect(withdrawn.status).toBe('WITHDRAWN');
  });
});
