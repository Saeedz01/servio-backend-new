import { NotFoundException } from '@nestjs/common';
import { WalletsService } from './wallets.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { MONTHLY_PROVIDER_COINS } from './entities/provider-token-wallet.entity.js';

function makePrismaMock() {
  return {
    provider: { findUnique: vi.fn() },
    providerTokenWallet: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
  };
}

const provider = { id: 'provider-1', userId: 'user-1' };

function walletRow(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: 'wallet-1',
    providerId: 'provider-1',
    balance: MONTHLY_PROVIDER_COINS,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('WalletsService', () => {
  it('createForProvider: rejects unknown providers', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue(null);
    const service = new WalletsService(prisma as unknown as PrismaService);

    await expect(service.createForProvider('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('createForProvider: creates a wallet at 40 coins', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue(provider);
    prisma.providerTokenWallet.findUnique.mockResolvedValue(null);
    prisma.providerTokenWallet.create.mockResolvedValue(walletRow());
    const service = new WalletsService(prisma as unknown as PrismaService);

    const created = await service.createForProvider('provider-1');

    expect(created.balance).toBe(40);
    expect(prisma.providerTokenWallet.create).toHaveBeenCalledWith({
      data: { providerId: 'provider-1', balance: 40 },
    });
  });

  it('getOrEnsureForProvider: refills to 40 when updatedAt is a prior month', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue(provider);
    const lastMonth = new Date();
    lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1);
    prisma.providerTokenWallet.findUnique.mockResolvedValue(walletRow({ balance: 12, updatedAt: lastMonth }));
    prisma.providerTokenWallet.update.mockResolvedValue(walletRow({ balance: 40 }));
    const service = new WalletsService(prisma as unknown as PrismaService);

    const wallet = await service.getOrEnsureForProvider('provider-1');

    expect(wallet.balance).toBe(40);
    expect(prisma.providerTokenWallet.update).toHaveBeenCalledWith({
      where: { id: 'wallet-1' },
      data: { balance: 40 },
    });
  });

  it('refillAllMonthly: sets every wallet to 40', async () => {
    const prisma = makePrismaMock();
    prisma.providerTokenWallet.updateMany.mockResolvedValue({ count: 3 });
    const service = new WalletsService(prisma as unknown as PrismaService);

    await expect(service.refillAllMonthly()).resolves.toEqual({ updated: 3 });
    expect(prisma.providerTokenWallet.updateMany).toHaveBeenCalledWith({
      data: { balance: 40 },
    });
  });

  it('spend: deducts coins from the wallet balance', async () => {
    const prisma = makePrismaMock();
    prisma.provider.findUnique.mockResolvedValue(provider);
    prisma.providerTokenWallet.findUnique.mockResolvedValue(walletRow({ balance: 40 }));
    prisma.providerTokenWallet.update.mockResolvedValue(walletRow({ balance: 35 }));
    const service = new WalletsService(prisma as unknown as PrismaService);

    const next = await service.spend('provider-1', 5);

    expect(next.balance).toBe(35);
    expect(prisma.providerTokenWallet.update).toHaveBeenCalledWith({
      where: { id: 'wallet-1' },
      data: { balance: 35 },
    });
  });
});
