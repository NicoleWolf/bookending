/**
 * Dev cleanup — deletes all manuscript-related data across all users.
 * Run with: npx tsx prisma/cleanup.ts
 * Safe to run multiple times.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all manuscript data…');

  // Must delete in dependency order — no cascade on Chapter/BetaReader/FormattingProject
  const notes     = await prisma.chapterNote.deleteMany({});
  const chapters  = await prisma.chapter.deleteMany({});
  const readers   = await prisma.betaReader.deleteMany({});
  const projects  = await prisma.formattingProject.deleteMany({});

  // Unlink products from manuscripts rather than deleting (products may have other data)
  const unlinked  = await prisma.product.updateMany({
    where: { manuscriptId: { not: null } },
    data:  { manuscriptId: null },
  });

  // Manuscript delete cascades: BetaJoinRequest, ManuscriptVersion, ManuscriptVersionChapter
  const manuscripts = await prisma.manuscript.deleteMany({});

  console.log(`Deleted:`);
  console.log(`  ${manuscripts.count} manuscripts`);
  console.log(`  ${chapters.count} chapters`);
  console.log(`  ${notes.count} chapter notes`);
  console.log(`  ${readers.count} beta readers`);
  console.log(`  ${projects.count} formatting projects`);
  console.log(`  ${unlinked.count} products unlinked`);
  console.log('Done.');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
