/**
 * Dev seed — creates test users and manuscripts across all betaMode values.
 * Run with: npm run db:seed
 * Safe to re-run — uses upsert for users, delete+recreate for manuscripts.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding beta-enrollment test data…');

  // ── Users ──────────────────────────────────────────────────────────────────
  const writer = await prisma.user.upsert({
    where: { email: 'seed-writer@bookending.dev' },
    update: {},
    create: {
      id:    'seed-writer-001',
      email: 'seed-writer@bookending.dev',
      name:  'Billie Wolf (seed)',
      role:  'AUTHOR',
    },
  });

  const reader1 = await prisma.user.upsert({
    where: { email: 'seed-reader1@bookending.dev' },
    update: {},
    create: {
      id:    'seed-reader-001',
      email: 'seed-reader1@bookending.dev',
      name:  'Asha Patel',
      role:  'READER',
    },
  });

  const reader2 = await prisma.user.upsert({
    where: { email: 'seed-reader2@bookending.dev' },
    update: {},
    create: {
      id:    'seed-reader-002',
      email: 'seed-reader2@bookending.dev',
      name:  'Tomás Rivera',
      role:  'READER',
    },
  });

  // ── Clear previous seed manuscripts ───────────────────────────────────────
  const seedIds = ['seed-ms-closed', 'seed-ms-public', 'seed-ms-public-full', 'seed-ms-request', 'seed-ms-invite'];
  await prisma.betaJoinRequest.deleteMany({ where: { manuscriptId: { in: seedIds } } });
  await prisma.betaReader.deleteMany({ where: { manuscriptId: { in: seedIds } } });
  await prisma.manuscript.deleteMany({ where: { id: { in: seedIds } } });

  // ── Manuscript 1: CLOSED (not discoverable) ────────────────────────────────
  await prisma.manuscript.create({
    data: {
      id:          'seed-ms-closed',
      title:       'The Quiet Shore',
      subtitle:    'A novel in letters',
      genre:       'Literary Fiction',
      description: 'An epistolary novel about two estranged sisters reconnecting through letters found in their late mother\'s attic.',
      betaMode:    'CLOSED',
      status:      'DRAFTING',
      language:    'English',
      authorId:    writer.id,
    },
  });

  // ── Manuscript 2: PUBLIC (anyone can join, cap 10) ──────────────────────────
  const ms2 = await prisma.manuscript.create({
    data: {
      id:             'seed-ms-public',
      title:          'Hollow Meridian',
      subtitle:       'A climate thriller',
      genre:          'Thriller',
      description:    'In 2047, a cartographer discovers that the flood maps she\'s been drawing for the government are deliberately wrong.',
      betaMode:       'PUBLIC',
      maxBetaReaders: 10,
      status:         'IN_REVISION',
      language:       'English',
      authorId:       writer.id,
    },
  });

  // Add reader1 as an enrolled beta reader
  await prisma.betaReader.create({
    data: {
      name:         reader1.name,
      email:        reader1.email,
      manuscriptId: ms2.id,
      userId:       reader1.id,
      progress:     0.34,
    },
  });

  // ── Manuscript 3: PUBLIC but FULL (cap 2, 2 enrolled) ─────────────────────
  const ms3 = await prisma.manuscript.create({
    data: {
      id:             'seed-ms-public-full',
      title:          'The Salt Roads',
      subtitle:       null,
      genre:          'Historical Fiction',
      description:    'Three women across centuries — a Carthaginian priestess, a Caribbean enslaved healer, a modern Haitian poet — bound by the same dream.',
      betaMode:       'PUBLIC',
      maxBetaReaders: 2,
      status:         'DRAFTING',
      language:       'English',
      authorId:       writer.id,
    },
  });

  await prisma.betaReader.createMany({
    data: [
      { name: reader1.name, email: reader1.email, manuscriptId: ms3.id, userId: reader1.id },
      { name: reader2.name, email: reader2.email, manuscriptId: ms3.id, userId: reader2.id },
    ],
  });

  // ── Manuscript 4: REQUEST (writer approves each reader) ───────────────────
  const ms4 = await prisma.manuscript.create({
    data: {
      id:          'seed-ms-request',
      title:       'After the Rains',
      subtitle:    'Stories',
      genre:       'Short Stories',
      description: 'Nine stories set in the same fictional West African city across a century of change.',
      betaMode:    'REQUEST',
      status:      'DRAFTING',
      language:    'English',
      authorId:    writer.id,
    },
  });

  // Two pending requests on the REQUEST manuscript
  await prisma.betaJoinRequest.create({
    data: {
      manuscriptId: ms4.id,
      userId:       reader1.id,
      note:         'I write short fiction and would love to read this — West African lit is close to my heart.',
      status:       'PENDING',
    },
  });

  await prisma.betaJoinRequest.create({
    data: {
      manuscriptId: ms4.id,
      userId:       reader2.id,
      note:         'Huge fan of linked short story collections. Happy to give detailed chapter feedback.',
      status:       'PENDING',
    },
  });

  // ── Manuscript 5: INVITE_ONLY (hidden from browse) ─────────────────────────
  await prisma.manuscript.create({
    data: {
      id:          'seed-ms-invite',
      title:       'Archipelago',
      subtitle:    'A memoir',
      genre:       'Memoir',
      description: 'A memoir about growing up between two islands and never quite belonging to either.',
      betaMode:    'INVITE_ONLY',
      status:      'DRAFTING',
      language:    'English',
      authorId:    writer.id,
    },
  });

  console.log('Done. Created:');
  console.log('  Users:       seed-writer@bookending.dev, seed-reader1@bookending.dev, seed-reader2@bookending.dev');
  console.log('  Manuscripts: CLOSED · PUBLIC (open) · PUBLIC (full) · REQUEST (2 pending) · INVITE_ONLY');
  console.log('\nDev token for seed writer: dev:seed-writer-001:seed-writer@bookending.dev:Billie%20Wolf%20(seed)');
  console.log('Dev token for reader 1:    dev:seed-reader-001:seed-reader1@bookending.dev:Asha%20Patel');
  console.log('Dev token for reader 2:    dev:seed-reader-002:seed-reader2@bookending.dev:Tom%C3%A1s%20Rivera');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
