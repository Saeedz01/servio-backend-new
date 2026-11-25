import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

// A fake PrismaService: every database method is a vi.fn() the test
// controls. No real database is touched.
function makePrismaMock() {
  return {
    provider: { findUnique: vi.fn() },
    serviceCategory: { findUnique: vi.fn(), findMany: vi.fn() },
    serviceArea: { findUnique: vi.fn(), findMany: vi.fn() },
    service: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
}

function serviceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'service-1',
    providerId: 'provider-1',
    title: 'Fan work',
    description: '',
    imageUrl: '',
    address: '',
    lat: 0,
    lng: 0,
    radiusKm: 10,
    priceAmount: 0,
    priceUnit: 'PER_VISIT',
    availability: {},
    status: 'DRAFT',
    categoryId: 'category-1',
    specialty: [],
    serviceAreaId: 'area-1',
    experience: 0,
    visitCharges: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const createDto = {
  providerId: '11111111-1111-4111-8111-111111111111',
  title: 'Fan work',
  categoryId: '22222222-2222-4222-8222-222222222222',
  serviceAreaId: '33333333-3333-4333-8333-333333333333',
};

describe('ServicesService', () => {
  it('create: rejects an unknown provider', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue(null);
    const service = new ServicesService(prisma as unknown as PrismaService);

    await expect(service.create(createDto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create: rejects a fourth service for a provider', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue({ id: 'provider-1' });
    prisma.serviceCategory.findUnique.mockResolvedValue({ id: 'category-1' });
    prisma.serviceArea.findUnique.mockResolvedValue({ id: 'area-1' });
    prisma.service.count.mockResolvedValue(3);
    const service = new ServicesService(prisma as unknown as PrismaService);

    await expect(service.create(createDto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('create: fills in defaults for availability and status', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue({ id: 'provider-1' });
    prisma.serviceCategory.findUnique.mockResolvedValue({ id: 'category-1' });
    prisma.serviceArea.findUnique.mockResolvedValue({ id: 'area-1' });
    prisma.service.count.mockResolvedValue(0);
    prisma.service.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => serviceRow({ ...data }),
    );
    const service = new ServicesService(prisma as unknown as PrismaService);

    const created = await service.create(createDto);

    expect(created.availability).toEqual({});
    expect(created.status).toBe('DRAFT');
    expect(created.priceAmount).toBe(0);
  });

  it('findOne: rejects an unknown service', async () => {
    const prisma = makePrismaMock();
    prisma.service.findUnique.mockResolvedValue(null);
    const service = new ServicesService(prisma as unknown as PrismaService);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findAll: passes the filters to the database', async () => {
    const prisma = makePrismaMock();
    prisma.service.findMany.mockResolvedValue([serviceRow()]);
    const service = new ServicesService(prisma as unknown as PrismaService);

    const found = await service.findAll({ providerId: 'provider-1', status: 'ACTIVE' });

    expect(found).toHaveLength(1);
    const where = prisma.service.findMany.mock.calls[0][0].where as Record<string, unknown>;
    expect(where.providerId).toBe('provider-1');
    expect(where.status).toBe('ACTIVE');
  });
});
