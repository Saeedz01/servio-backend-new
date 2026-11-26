import type { Bid, BidStatus } from '@prisma/client';

// What the API returns for a bid: the database row, plus the provider
// who made it (name and profile picture only).
export interface BidEntity {
  id: string;
  providerId: string;
  provider: { id: string; name: string; profilePic: string | null };
  jobId: string;
  price: number;
  note: string;
  visitFee: number;
  status: BidStatus;
  createdAt: Date;
  updatedAt: Date;
}

type BidRow = Bid & {
  provider: { id: string; profilePic: string | null; user: { name: string } };
};

// Converts a database row (with its provider and the provider's user
// loaded) into the shape the API returns.
export function toBidEntity(bid: BidRow): BidEntity {
  return {
    id: bid.id,
    providerId: bid.providerId,
    provider: {
      id: bid.provider.id,
      name: bid.provider.user.name,
      profilePic: bid.provider.profilePic,
    },
    jobId: bid.jobId,
    price: bid.price,
    note: bid.note,
    visitFee: bid.visitFee,
    status: bid.status,
    createdAt: bid.createdAt,
    updatedAt: bid.updatedAt,
  };
}
