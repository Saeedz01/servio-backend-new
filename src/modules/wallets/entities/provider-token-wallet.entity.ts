import type { ProviderTokenWallet } from '@prisma/client';

export const MONTHLY_PROVIDER_COINS = 40;

export interface ProviderTokenWalletEntity {
  id: string;
  providerId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toProviderTokenWalletEntity(row: ProviderTokenWallet): ProviderTokenWalletEntity {
  return {
    id: row.id,
    providerId: row.providerId,
    balance: row.balance,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
