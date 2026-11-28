import type { Booking, BookingStatus, Service } from '@prisma/client';

export interface BookingServiceSummary {
  id: string;
  providerId: string;
  title: string;
  description: string;
  priceAmount: number;
  visitCharges: number;
  categoryId: string;
}

export interface BookingSeekerSummary {
  id: string;
  name: string;
  phone: string;
}

export interface BookingEntity {
  id: string;
  seekerId: string;
  serviceId: string;
  address: string;
  lat: number;
  lng: number;
  note: string;
  neededAt: Date;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
  seeker?: BookingSeekerSummary;
  service?: BookingServiceSummary;
}

type BookingRow = Booking & {
  seeker?: { id: string; name: string; phone: string };
  service?: Pick<
    Service,
    'id' | 'providerId' | 'title' | 'description' | 'priceAmount' | 'visitCharges' | 'categoryId'
  >;
};

export function toBookingEntity(row: BookingRow): BookingEntity {
  const entity: BookingEntity = {
    id: row.id,
    seekerId: row.seekerId,
    serviceId: row.serviceId,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    note: row.note,
    neededAt: row.neededAt,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  if (row.seeker) {
    entity.seeker = {
      id: row.seeker.id,
      name: row.seeker.name,
      phone: row.seeker.phone,
    };
  }
  if (row.service) {
    entity.service = {
      id: row.service.id,
      providerId: row.service.providerId,
      title: row.service.title,
      description: row.service.description,
      priceAmount: row.service.priceAmount,
      visitCharges: row.service.visitCharges,
      categoryId: row.service.categoryId,
    };
  }
  return entity;
}
