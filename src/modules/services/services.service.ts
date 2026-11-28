import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateServiceDto } from './dto/create-service.dto.js';
import type { UpdateServiceDto } from './dto/update-service.dto.js';
import type { ListServicesQuery } from './dto/list-services.dto.js';
import { toServiceEntity, type ServiceEntity } from './entities/service.entity.js';

// A provider can offer at most 3 services, the same limit as the
// frontend demo.
const MAX_SERVICES_PER_PROVIDER = 3;

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateServiceDto): Promise<ServiceEntity> {
    const provider = await this.prisma.provider.findUnique({ where: { id: dto.providerId } });
    if (!provider) {
      throw new NotFoundException(`Provider "${dto.providerId}" was not found.`);
    }
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Service category "${dto.categoryId}" was not found.`);
    }
    const area = await this.prisma.serviceArea.findUnique({ where: { id: dto.serviceAreaId } });
    if (!area) {
      throw new NotFoundException(`Service area "${dto.serviceAreaId}" was not found.`);
    }
    const existingCount = await this.prisma.service.count({
      where: { providerId: dto.providerId },
    });
    if (existingCount >= MAX_SERVICES_PER_PROVIDER) {
      throw new ConflictException('A provider can have at most 3 services.');
    }
    const service = await this.prisma.service.create({
      data: {
        providerId: dto.providerId,
        title: dto.title,
        description: dto.description ?? '',
        imageUrl: dto.imageUrl ?? '',
        address: dto.address ?? '',
        lat: dto.lat ?? 0,
        lng: dto.lng ?? 0,
        radiusKm: dto.radiusKm ?? 10,
        priceAmount: dto.priceAmount ?? 0,
        priceUnit: dto.priceUnit ?? 'PER_VISIT',
        availability: (dto.availability ?? {}) as Prisma.InputJsonValue,
        status: dto.status ?? 'DRAFT',
        categoryId: dto.categoryId,
        specialty: dto.specialty ?? [],
        serviceAreaId: dto.serviceAreaId,
        experience: dto.experience ?? 0,
        visitCharges: dto.visitCharges ?? 0,
      },
    });
    return toServiceEntity(service);
  }

  async findAll(query: ListServicesQuery): Promise<ServiceEntity[]> {
    const services = await this.prisma.service.findMany({
      where: {
        providerId: query.providerId,
        categoryId: query.categoryId,
        serviceAreaId: query.serviceAreaId,
        status: query.status,
      },
      include: {
        provider: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return services.map(toServiceEntity);
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service "${id}" was not found.`);
    }
    return toServiceEntity(service);
  }

  async update(id: string, dto: UpdateServiceDto): Promise<ServiceEntity> {
    await this.findOne(id);
    if (dto.categoryId) {
      const category = await this.prisma.serviceCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Service category "${dto.categoryId}" was not found.`);
      }
    }
    if (dto.serviceAreaId) {
      const area = await this.prisma.serviceArea.findUnique({ where: { id: dto.serviceAreaId } });
      if (!area) {
        throw new NotFoundException(`Service area "${dto.serviceAreaId}" was not found.`);
      }
    }
    const { availability, ...rest } = dto;
    const data: Prisma.ServiceUpdateInput = { ...rest };
    if (availability !== undefined) {
      data.availability = availability as Prisma.InputJsonValue;
    }
    const service = await this.prisma.service.update({ where: { id }, data });
    return toServiceEntity(service);
  }

  async remove(id: string): Promise<ServiceEntity> {
    const service = await this.findOne(id);
    await this.prisma.service.delete({ where: { id } });
    return service;
  }

  // Read-only catalog data. Categories and areas have no module of
  // their own; they are served from here.
  async findAllCategories() {
    return this.prisma.serviceCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async findOneCategory(id: string) {
    const category = await this.prisma.serviceCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Service category "${id}" was not found.`);
    }
    return category;
  }

  async findAllAreas() {
    return this.prisma.serviceArea.findMany({ orderBy: { name: 'asc' } });
  }

  async findOneArea(id: string) {
    const area = await this.prisma.serviceArea.findUnique({ where: { id } });
    if (!area) {
      throw new NotFoundException(`Service area "${id}" was not found.`);
    }
    return area;
  }
}
