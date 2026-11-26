import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateJobDto } from './dto/create-job.dto.js';
import type { UpdateJobDto } from './dto/update-job.dto.js';
import type { ListJobsQuery } from './dto/list-jobs.dto.js';
import type { AwardJobDto } from './dto/award-job.dto.js';
import { toJobEntity, type JobEntity } from './entities/job.entity.js';

// Always load the seeker and the category together with a job, so
// the response can show who posted it and what it is about.
const jobInclude = {
  seeker: { select: { id: true, name: true, phone: true } },
  category: { select: { id: true, slug: true, name: true } },
} as const;

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  // Post a job. Only a user with the seeker role can post one, and
  // the category must exist. Every job starts out PENDING.
  async create(dto: CreateJobDto): Promise<JobEntity> {
    const seeker = await this.prisma.user.findUnique({
      where: { id: dto.seekerId },
      include: { role: true },
    });
    if (!seeker) {
      throw new NotFoundException(`User "${dto.seekerId}" was not found.`);
    }
    if (seeker.role.role !== 'seeker') {
      throw new ForbiddenException('Only seekers can post jobs.');
    }
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Service category "${dto.categoryId}" was not found.`);
    }
    const job = await this.prisma.job.create({
      data: {
        seekerId: dto.seekerId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description ?? '',
        address: dto.address ?? '',
        latitude: dto.latitude ?? 0,
        longitude: dto.longitude ?? 0,
        requestedAt: dto.requestedAt,
      },
      include: jobInclude,
    });
    return toJobEntity(job);
  }

  async findAll(query: ListJobsQuery): Promise<JobEntity[]> {
    // The relevance filter: a provider only sees jobs in categories
    // they offer services in. A provider with no services sees none.
    let categoryFilter: string | { in: string[] } | undefined = query.categoryId;
    if (query.providerId) {
      const provider = await this.prisma.provider.findUnique({
        where: { id: query.providerId },
      });
      if (!provider) {
        throw new NotFoundException(`Provider "${query.providerId}" was not found.`);
      }
      const services = await this.prisma.service.findMany({
        where: { providerId: query.providerId },
        select: { categoryId: true },
      });
      const offered = [...new Set(services.map((s) => s.categoryId))];
      if (offered.length === 0) {
        return [];
      }
      if (query.categoryId && !offered.includes(query.categoryId)) {
        return [];
      }
      categoryFilter = { in: offered };
    }
    const jobs = await this.prisma.job.findMany({
      where: {
        seekerId: query.seekerId,
        categoryId: categoryFilter,
        status: query.status,
      },
      include: jobInclude,
      orderBy: { createdAt: 'desc' },
    });
    return jobs.map(toJobEntity);
  }

  async findOne(id: string): Promise<JobEntity> {
    const job = await this.prisma.job.findUnique({ where: { id }, include: jobInclude });
    if (!job) {
      throw new NotFoundException(`Job "${id}" was not found.`);
    }
    return toJobEntity(job);
  }

  // Edit a job while it is still pending. The status is changed
  // through the award/cancel/complete endpoints, not here.
  async update(id: string, dto: UpdateJobDto): Promise<JobEntity> {
    const existing = await this.findOne(id);
    if (existing.status !== 'PENDING') {
      throw new ConflictException('Only a pending job can be edited.');
    }
    if (dto.categoryId) {
      const category = await this.prisma.serviceCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Service category "${dto.categoryId}" was not found.`);
      }
    }
    const data: Prisma.JobUpdateInput = { ...dto };
    const job = await this.prisma.job.update({ where: { id }, data, include: jobInclude });
    return toJobEntity(job);
  }

  async remove(id: string): Promise<JobEntity> {
    const job = await this.findOne(id);
    if (job.status !== 'PENDING') {
      throw new ConflictException('Only a pending job can be deleted.');
    }
    // The bids on the job are deleted automatically by the database.
    await this.prisma.job.delete({ where: { id } });
    return job;
  }

  // Award a job to one bid, in a single transaction: the job becomes
  // AWARDED, the picked bid becomes ACCEPTED, and every other pending
  // bid on the job becomes REJECTED.
  async award(id: string, dto: AwardJobDto): Promise<JobEntity> {
    const job = await this.findOne(id);
    if (job.status !== 'PENDING') {
      throw new ConflictException('Only a pending job can be awarded.');
    }
    const bid = await this.prisma.bid.findUnique({ where: { id: dto.bidId } });
    if (!bid || bid.jobId !== id) {
      throw new NotFoundException(`Bid "${dto.bidId}" was not found on this job.`);
    }
    const awarded = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
        where: { id },
        data: { status: 'AWARDED' },
        include: jobInclude,
      });
      await tx.bid.update({ where: { id: dto.bidId }, data: { status: 'ACCEPTED' } });
      await tx.bid.updateMany({
        where: { jobId: id, status: 'PENDING', id: { not: dto.bidId } },
        data: { status: 'REJECTED' },
      });
      return updated;
    });
    return toJobEntity(awarded);
  }

  async cancel(id: string): Promise<JobEntity> {
    const job = await this.findOne(id);
    if (job.status !== 'PENDING') {
      throw new ConflictException('Only a pending job can be cancelled.');
    }
    const cancelled = await this.prisma.job.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: jobInclude,
    });
    return toJobEntity(cancelled);
  }

  async complete(id: string): Promise<JobEntity> {
    const job = await this.findOne(id);
    if (job.status !== 'AWARDED') {
      throw new ConflictException('Only an awarded job can be completed.');
    }
    const completed = await this.prisma.job.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: jobInclude,
    });
    return toJobEntity(completed);
  }
}
