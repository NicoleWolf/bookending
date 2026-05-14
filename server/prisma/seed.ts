/**
 * Dev seed — creates test users for auth testing.
 * Run with: npm run db:seed
 * Safe to re-run — uses upsert.
 *
 * Does NOT create manuscripts. Manuscript data comes from the app UI only.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dev users…');

  await prisma.user.upsert({
    where:  { email: 'seed-writer@bookending.dev' },
    update: {},
    create: {
      id:    'seed-writer-001',
      email: 'seed-writer@bookending.dev',
      name:  'Billie Wolf (seed)',
      role:  'AUTHOR',
    },
  });

  await prisma.user.upsert({
    where:  { email: 'seed-reader1@bookending.dev' },
    update: {},
    create: {
      id:    'seed-reader-001',
      email: 'seed-reader1@bookending.dev',
      name:  'Asha Patel',
      role:  'READER',
    },
  });

  await prisma.user.upsert({
    where:  { email: 'seed-reader2@bookending.dev' },
    update: {},
    create: {
      id:    'seed-reader-002',
      email: 'seed-reader2@bookending.dev',
      name:  'Tomás Rivera',
      role:  'READER',
    },
  });

  console.log('Done. Dev accounts:');
  console.log('  seed-writer@bookending.dev  (AUTHOR)');
  console.log('  seed-reader1@bookending.dev (READER)');
  console.log('  seed-reader2@bookending.dev (READER)');
  console.log('\nDev tokens:');
  console.log('  Writer: dev:seed-writer-001:seed-writer@bookending.dev:Billie%20Wolf%20(seed)');
  console.log('  Reader 1: dev:seed-reader-001:seed-reader1@bookending.dev:Asha%20Patel');
  console.log('  Reader 2: dev:seed-reader-002:seed-reader2@bookending.dev:Tom%C3%A1s%20Rivera');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
