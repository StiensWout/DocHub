import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  // Create parks
  await prisma.park.upsert({
    where: { id: 'dae968d5-630d-4719-8b06-3d107e944401' },
    update: {},
    create: {
      id: 'dae968d5-630d-4719-8b06-3d107e944401',
      name: 'Disneyland Park',
      timezone: 'Europe/Paris'
    }
  });

  await prisma.park.upsert({
    where: { id: '8601174b-3ab1-43ae-b021-6e86a6a398c6' },
    update: {},
    create: {
      id: '8601174b-3ab1-43ae-b021-6e86a6a398c6',
      name: 'Walt Disney Studios Park',
      timezone: 'Europe/Paris'
    }
  });

  console.log('Database seeded successfully');
}

seed()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });