import type { Job, JobStatus } from '@prisma/client';

// What the API returns for a job: the database row, plus the seeker
// who posted it and the category it belongs to. No password, ever.
export interface JobEntity {
  id: string;
  seekerId: string;
  seeker: { id: string; name: string; phone: string };
  categoryId: string;
  category: { id: string; slug: string; name: string };
  title: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  status: JobStatus;
  requestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

type JobRow = Job & {
  seeker: { id: string; name: string; phone: string };
  category: { id: string; slug: string; name: string };
};

// Converts a database row (with its seeker and category loaded) into
// the shape the API returns.
export function toJobEntity(job: JobRow): JobEntity {
  return {
    id: job.id,
    seekerId: job.seekerId,
    seeker: job.seeker,
    categoryId: job.categoryId,
    category: job.category,
    title: job.title,
    description: job.description,
    address: job.address,
    latitude: job.latitude,
    longitude: job.longitude,
    status: job.status,
    requestedAt: job.requestedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}
