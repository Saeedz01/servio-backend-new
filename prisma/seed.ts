// Seeds the database with roles, areas, categories and three demo
// users (admin, provider, seeker) plus two services for the provider.
// Safe to run more than once: every record is upserted by its unique
// field, so re-running it changes nothing.
//
// Run with: pnpm db:seed
// Demo passwords (demo only, never use in production): Admin123!,
// Provider123!, Seeker123!

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// The seed runs outside Nest, so load .env by hand.
try {
  process.loadEnvFile();
} catch {
  // No .env file: DATABASE_URL is expected in the environment instead.
}

const prisma = new PrismaClient();

const AREAS = [
  { name: 'Depalpur', slug: 'depalpur' },
  { name: 'Haveli Lakha', slug: 'haveli-lakha' },
  { name: 'Hujra Shah Muqeem', slug: 'hujra-shah-muqeem' },
  { name: 'Basirpur', slug: 'basirpur' },
  { name: 'Okara City', slug: 'okara-city' },
  { name: 'Okara Cantt', slug: 'okara-cantt' },
  { name: 'Other', slug: 'other' },
];

const CATEGORIES = [
  {
    name: 'Plumber',
    nameRoman: 'Plumber',
    slug: 'plumber',
    description: 'Tap repair, pipe fitting, leakage fixing and bathroom fitting.',
  },
  {
    name: 'Electrician',
    nameRoman: 'Bijli Wala',
    slug: 'electrician',
    description: 'Fan, wiring, switch board, UPS and lighting work.',
  },
  {
    name: 'AC Technician',
    nameRoman: 'AC Wala',
    slug: 'ac-technician',
    description: 'AC service, gas refill, installation and repair.',
  },
  {
    name: 'Carpenter',
    nameRoman: 'Barhai',
    slug: 'carpenter',
    description: 'Door, almari, furniture repair and woodwork.',
  },
  {
    name: 'Painter',
    nameRoman: 'Painter',
    slug: 'painter',
    description: 'Wall painting, whitewash, texture and polish work.',
  },
  {
    name: 'Geyser/Appliance Repair',
    nameRoman: 'Geyser / Appliance',
    slug: 'geyser-appliance-repair',
    description: 'Geyser, washing machine, fridge and other appliance repair.',
  },
  {
    name: 'Mobile Repair',
    nameRoman: 'Mobile Repair',
    slug: 'mobile-repair',
    description: 'Mobile screen, battery, charging port and software issues.',
  },
  {
    name: 'Computer/Laptop Repair',
    nameRoman: 'Computer / Laptop',
    slug: 'computer-laptop-repair',
    description: 'Laptop and computer repair, Windows installation and parts.',
  },
  {
    name: 'CCTV Installation',
    nameRoman: 'CCTV Lagwana',
    slug: 'cctv-installation',
    description: 'CCTV camera installation, DVR setup and maintenance.',
  },
  {
    name: 'Handyman/General Labour',
    nameRoman: 'Har Kaam Wala',
    slug: 'handyman',
    description: 'General home repair, fitting and everyday labour work.',
  },
];

const USERS = [
  { name: 'Admin', phone: '0300-9999999', password: 'Admin123!', role: 'admin' },
  { name: 'Rafiq Ahmed', phone: '0300-2222222', password: 'Provider123!', role: 'provider' },
  { name: 'Ayesha', phone: '0300-1111111', password: 'Seeker123!', role: 'seeker' },
];

async function main(): Promise<void> {
  // Roles
  const roles: Record<string, string> = {};
  for (const roleName of ['admin', 'provider', 'seeker']) {
    const role = await prisma.role.upsert({
      where: { role: roleName },
      update: {},
      create: { role: roleName },
    });
    roles[roleName] = role.id;
  }

  // Service areas
  const areas: Record<string, string> = {};
  for (const area of AREAS) {
    const row = await prisma.serviceArea.upsert({
      where: { slug: area.slug },
      update: { name: area.name },
      create: { ...area, isActive: true },
    });
    areas[area.slug] = row.id;
  }

  // Service categories
  const categories: Record<string, string> = {};
  for (const category of CATEGORIES) {
    const row = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: { ...category, isActive: true },
      create: { ...category, isActive: true },
    });
    categories[category.slug] = row.id;
  }

  // Demo users. A provider row is created for the provider user.
  let providerId = '';
  for (const seedUser of USERS) {
    const password = await bcrypt.hash(seedUser.password, 10);
    const user = await prisma.user.upsert({
      where: { phone: seedUser.phone },
      update: { name: seedUser.name, password, roleId: roles[seedUser.role] },
      create: {
        name: seedUser.name,
        phone: seedUser.phone,
        password,
        roleId: roles[seedUser.role],
      },
    });
    if (seedUser.role === 'provider') {
      const provider = await prisma.provider.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, profilePic: '' },
      });
      providerId = provider.id;
    }
  }

  // Two demo services for the seeded provider.
  const demoServices = [
    {
      title: 'Fan, wiring and switch board work',
      description: 'Fan, wiring, UPS aur switch board ka kaam.',
      categorySlug: 'electrician',
      areaSlug: 'depalpur',
      lat: 30.66,
      lng: 73.65,
      priceAmount: 1500,
      visitCharges: 200,
    },
    {
      title: 'General home repair and fitting work',
      description: 'General home repair, fitting and everyday labour work.',
      categorySlug: 'handyman',
      areaSlug: 'basirpur',
      lat: 30.7,
      lng: 73.6,
      priceAmount: 1000,
      visitCharges: 150,
    },
  ];
  const availability = { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], hours: '9am-6pm' };
  for (const demo of demoServices) {
    const existing = await prisma.service.findFirst({
      where: { providerId, title: demo.title },
    });
    if (!existing) {
      await prisma.service.create({
        data: {
          providerId,
          title: demo.title,
          description: demo.description,
          address: '',
          lat: demo.lat,
          lng: demo.lng,
          radiusKm: 10,
          priceAmount: demo.priceAmount,
          priceUnit: 'PER_VISIT',
          availability,
          status: 'ACTIVE',
          categoryId: categories[demo.categorySlug],
          serviceAreaId: areas[demo.areaSlug],
          experience: 8,
          visitCharges: demo.visitCharges,
        },
      });
    }
  }

  console.log('Seed done: 3 roles, 7 areas, 10 categories, 3 users, 2 services.');
}

await main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
