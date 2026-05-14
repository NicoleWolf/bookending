/**
 * One-time cleanup — deletes "Wayfinder Untitled" (07299ca7-...) from the DB.
 * Run with: npx tsx prisma/delete-untitled.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TARGET_ID = '07299ca7-f879-4054-8c8b-ab17720bc746';

async function main() {
  const ms = await prisma.manuscript.findUnique({ where: { id: TARGET_ID }, select: { id: true, title: true } });
  if (!ms) { console.log('Not found — already deleted.'); return; }

  console.log(`Deleting "${ms.title}" (${ms.id})…`);

  // Fetch chapter IDs first — Prisma deleteMany doesn't support nested relation filters reliably
  const chapters = await prisma.chapter.findMany({ where: { manuscriptId: TARGET_ID }, select: { id: true } });
  const chapterIds = chapters.map(c => c.id);
  if (chapterIds.length > 0) {
    await prisma.chapterNote.deleteMany({ where: { chapterId: { in: chapterIds } } });
  }
  await prisma.chapter.deleteMany({ where: { manuscriptId: TARGET_ID } });
  await prisma.betaReader.deleteMany({ where: { manuscriptId: TARGET_ID } });
  await prisma.formattingProject.deleteMany({ where: { manuscriptId: TARGET_ID } });
  await prisma.product.updateMany({ where: { manuscriptId: TARGET_ID }, data: { manuscriptId: null } });
  await prisma.manuscript.delete({ where: { id: TARGET_ID } });

  console.log('Done.');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
