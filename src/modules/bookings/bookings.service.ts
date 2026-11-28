import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateBookingDto } from './dto/create-booking.dto.js';
import type { ListBookingsQuery } from './dto/list-bookings.dto.js';
import type { UpdateBookingDto } from './dto/update-booking.dto.js';
import { toBookingEntity, type BookingEntity } from './entities/booking.entity.js';

const bookingInclude = {
  seeker: { select: { id: true, name: true, phone: true } },
  service: {
    select: {
      id: true,
      providerId: true,
      title: true,
      description: true,
      priceAmount: true,
      visitCharges: true,
      categoryId: true,
    },
  },
} as const;

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto): Promise<BookingEntity> {
    const seeker = await this.prisma.user.findUnique({
      where: { id: dto.seekerId },
      include: { role: true },
    });
    if (!seeker) throw new NotFoundException(`User "${dto.seekerId}" was not found.`);
    if (seeker.role.role !== 'seeker') {
      throw new ForbiddenException('Only seekers can request a booking.');
    }
    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service) throw new NotFoundException(`Service "${dto.serviceId}" was not found.`);

    const row = await this.prisma.booking.create({
      data: {
        seekerId: dto.seekerId,
        serviceId: dto.serviceId,
        address: dto.address,
        lat: dto.lat ?? 0,
        lng: dto.lng ?? 0,
        note: dto.note ?? '',
        neededAt: dto.neededAt,
        status: 'PENDING',
      },
      include: bookingInclude,
    });
    return toBookingEntity(row);
  }

  async findAll(query: ListBookingsQuery): Promise<BookingEntity[]> {
    const rows = await this.prisma.booking.findMany({
      where: {
        seekerId: query.seekerId,
        serviceId: query.serviceId,
        status: query.status,
        ...(query.providerId
          ? { service: { providerId: query.providerId } }
          : {}),
      },
      include: bookingInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toBookingEntity);
  }

  async findOne(id: string): Promise<BookingEntity> {
    const row = await this.prisma.booking.findUnique({ where: { id }, include: bookingInclude });
    if (!row) throw new NotFoundException(`Booking "${id}" was not found.`);
    return toBookingEntity(row);
  }

  async update(id: string, dto: UpdateBookingDto): Promise<BookingEntity> {
    await this.findOne(id);
    const row = await this.prisma.booking.update({
      where: { id },
      data: {
        status: dto.status,
        address: dto.address,
        note: dto.note,
        lat: dto.lat,
        lng: dto.lng,
        neededAt: dto.neededAt,
      },
      include: bookingInclude,
    });
    return toBookingEntity(row);
  }

  async cancel(id: string): Promise<BookingEntity> {
    return this.update(id, { status: 'CANCELLED' });
  }
}
