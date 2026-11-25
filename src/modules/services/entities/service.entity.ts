import type { PriceUnit, Service, ServiceStatus } from '@prisma/client';

// What the API returns for a service: the database row, with the
// availability JSON kept as-is.
export interface ServiceEntity {
  id: string;
  providerId: string;
  title: string;
  description: string;
  imageUrl: string;
  address: string;
  lat: number;
  lng: number;
  radiusKm: number;
  priceAmount: number;
  priceUnit: PriceUnit;
  availability: unknown;
  status: ServiceStatus;
  categoryId: string;
  specialty: string[];
  serviceAreaId: string;
  experience: number;
  visitCharges: number;
  createdAt: Date;
  updatedAt: Date;
}

// Converts a database row into the shape the API returns.
export function toServiceEntity(service: Service): ServiceEntity {
  return {
    id: service.id,
    providerId: service.providerId,
    title: service.title,
    description: service.description,
    imageUrl: service.imageUrl,
    address: service.address,
    lat: service.lat,
    lng: service.lng,
    radiusKm: service.radiusKm,
    priceAmount: service.priceAmount,
    priceUnit: service.priceUnit,
    availability: service.availability,
    status: service.status,
    categoryId: service.categoryId,
    specialty: service.specialty,
    serviceAreaId: service.serviceAreaId,
    experience: service.experience,
    visitCharges: service.visitCharges,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}
