import type { PriceUnit, Service, ServiceStatus } from '@prisma/client';

// Optional provider identity joined on list reads so seekers can map
// ACTIVE services to a karigar without a separate providers API.
export interface ServiceProviderSummary {
  id: string;
  userId: string;
  name: string;
  phone: string;
  profilePic?: string | null;
}

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
  provider?: ServiceProviderSummary;
}

type ServiceWithOptionalProvider = Service & {
  provider?: {
    id: string;
    userId: string;
    profilePic: string | null;
    user: { id: string; name: string; phone: string };
  };
};

// Converts a database row into the shape the API returns.
export function toServiceEntity(service: ServiceWithOptionalProvider): ServiceEntity {
  const entity: ServiceEntity = {
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
  if (service.provider?.user) {
    entity.provider = {
      id: service.provider.id,
      userId: service.provider.userId,
      name: service.provider.user.name,
      phone: service.provider.user.phone,
      profilePic: service.provider.profilePic,
    };
  }
  return entity;
}
