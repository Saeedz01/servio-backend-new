import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  MONTHLY_PROVIDER_COINS,
  toProviderTokenWalletEntity,
  type ProviderTokenWalletEntity,
} from './entities/provider-token-wallet.entity.js';

function sameCalendarMonth(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a wallet at 40 coins when a provider is registered. */
  async createForProvider(providerId: string): Promise<ProviderTokenWalletEntity> {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) {
      throw new NotFoundException(`Provider "${providerId}" was not found.`);
    }
    const existing = await this.prisma.providerTokenWallet.findUnique({ where: { providerId } });
    if (existing) return toProviderTokenWalletEntity(existing);
    const row = await this.prisma.providerTokenWallet.create({
      data: { providerId, balance: MONTHLY_PROVIDER_COINS },
    });
    return toProviderTokenWalletEntity(row);
  }

  /**
   * Load a provider wallet. Missing wallets are created at 40.
   * Once per calendar month the balance is reset to the monthly 40-coin allowance.
   */
  async getOrEnsureForProvider(providerId: string): Promise<ProviderTokenWalletEntity> {
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider) {
      throw new NotFoundException(`Provider "${providerId}" was not found.`);
    }

    let row = await this.prisma.providerTokenWallet.findUnique({ where: { providerId } });
    if (!row) {
      row = await this.prisma.providerTokenWallet.create({
        data: { providerId, balance: MONTHLY_PROVIDER_COINS },
      });
      return toProviderTokenWalletEntity(row);
    }

    // New calendar month → restore the monthly 40-coin allowance.
    // Mid-month spends bump updatedAt, so they are not refilled again.
    if (!sameCalendarMonth(row.updatedAt, new Date())) {
      row = await this.prisma.providerTokenWallet.update({
        where: { id: row.id },
        data: { balance: MONTHLY_PROVIDER_COINS },
      });
    }

    return toProviderTokenWalletEntity(row);
  }

  /** Reset every provider wallet to 40 coins (monthly cron / admin). */
  async refillAllMonthly(): Promise<{ updated: number }> {
    const result = await this.prisma.providerTokenWallet.updateMany({
      data: { balance: MONTHLY_PROVIDER_COINS },
    });
    return { updated: result.count };
  }

  async findAll(): Promise<ProviderTokenWalletEntity[]> {
    const rows = await this.prisma.providerTokenWallet.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toProviderTokenWalletEntity);
  }

  /** Deduct coins for a contact reveal (default 5). Applies monthly refill first. */
  async spend(providerId: string, amount = 5): Promise<ProviderTokenWalletEntity> {
    if (!Number.isInteger(amount) || amount < 1) {
      throw new BadRequestException('Spend amount must be a positive integer.');
    }
    const wallet = await this.getOrEnsureForProvider(providerId);
    if (wallet.balance < amount) {
      throw new BadRequestException(`Insufficient coins. Need ${amount}, have ${wallet.balance}.`);
    }
    const row = await this.prisma.providerTokenWallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance - amount },
    });
    return toProviderTokenWalletEntity(row);
  }
}
