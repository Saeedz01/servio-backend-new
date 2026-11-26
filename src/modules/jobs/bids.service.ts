import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateBidDto } from './dto/create-bid.dto.js';
import type { UpdateBidDto } from './dto/update-bid.dto.js';
import type { ListBidsQuery } from './dto/list-bids.dto.js';
import { toBidEntity, type BidEntity } from './entities/bid.entity.js';

// Always load the provider together with a bid, plus the provider's
// user, so the response can show who made the bid.
const bidInclude = {
  provider: { include: { user: { select: { name: true } } } },
} as const;

@Injectable()
export class BidsService {
  constructor(private readonly prisma: PrismaService) {}

  // Bid on a job. A provider can bid only once per job, and only
  // while the job is still pending.
  async create(dto: CreateBidDto): Promise<BidEntity> {
    const provider = await this.prisma.provider.findUnique({ where: { id: dto.providerId } });
    if (!provider) {
      throw new NotFoundException(`Provider "${dto.providerId}" was not found.`);
    }
    const job = await this.prisma.job.findUnique({ where: { id: dto.jobId } });
    if (!job) {
      throw new NotFoundException(`Job "${dto.jobId}" was not found.`);
    }
    if (job.status !== 'PENDING') {
      throw new ConflictException('Bids can only be made on a pending job.');
    }
    const existing = await this.prisma.bid.findUnique({
      where: { providerId_jobId: { providerId: dto.providerId, jobId: dto.jobId } },
    });
    if (existing) {
      throw new ConflictException('This provider has already bid on this job.');
    }
    const bid = await this.prisma.bid.create({
      data: {
        providerId: dto.providerId,
        jobId: dto.jobId,
        price: dto.price ?? 0,
        note: dto.note ?? '',
        visitFee: dto.visitFee ?? 0,
      },
      include: bidInclude,
    });
    return toBidEntity(bid);
  }

  async findAll(query: ListBidsQuery): Promise<BidEntity[]> {
    if (query.jobId) {
      const job = await this.prisma.job.findUnique({ where: { id: query.jobId } });
      if (!job) {
        throw new NotFoundException(`Job "${query.jobId}" was not found.`);
      }
    }
    const bids = await this.prisma.bid.findMany({
      where: {
        jobId: query.jobId,
        providerId: query.providerId,
        status: query.status,
      },
      include: bidInclude,
      orderBy: { createdAt: 'desc' },
    });
    return bids.map(toBidEntity);
  }

  async findOne(id: string): Promise<BidEntity> {
    const bid = await this.prisma.bid.findUnique({ where: { id }, include: bidInclude });
    if (!bid) {
      throw new NotFoundException(`Bid "${id}" was not found.`);
    }
    return toBidEntity(bid);
  }

  // Edit a bid while it is still pending.
  async update(id: string, dto: UpdateBidDto): Promise<BidEntity> {
    const existing = await this.findOne(id);
    if (existing.status !== 'PENDING') {
      throw new ConflictException('Only a pending bid can be edited.');
    }
    const bid = await this.prisma.bid.update({
      where: { id },
      data: { ...dto },
      include: bidInclude,
    });
    return toBidEntity(bid);
  }

  async withdraw(id: string): Promise<BidEntity> {
    const existing = await this.findOne(id);
    if (existing.status !== 'PENDING') {
      throw new ConflictException('Only a pending bid can be withdrawn.');
    }
    const bid = await this.prisma.bid.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
      include: bidInclude,
    });
    return toBidEntity(bid);
  }

  async remove(id: string): Promise<BidEntity> {
    const bid = await this.findOne(id);
    if (bid.status !== 'PENDING') {
      throw new ConflictException('Only a pending bid can be deleted.');
    }
    await this.prisma.bid.delete({ where: { id } });
    return bid;
  }
}
