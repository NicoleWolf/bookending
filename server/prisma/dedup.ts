/**
 * One-time dedup — removes duplicate manuscripts (same authorId + title).
 * Keeps the most recently created record; deletes all earlier duplicates
 * along with their dependent data (chapters, notes, betaReaders, etc.).
 *
 * Run with: npx tsx prisma/dedup.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const manuscripts = await prisma.manuscript.findMany({
    select: { id: true, title: true, authorId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by authorId+title
  const groups = new Map<string, typeof manuscripts>();
  for (const m of manuscripts) {
    const key = `${m.authorId}::${m.title.trim().toLowerCase()}`;
    const group = groups.get(key) ?? [];
    group.push(m);
    groups.set(key, group);
  }

  let totalDeleted = 0;

  for (const [key, group] of groups) {
    if (group.length <= 1) continue;

    // Keep the last (most recently created); delete the rest
    const toDelete = group.slice(0, -1);
    const keepId   = group[group.length - 1].id;

    console.log(`\nDuplicate: "${group[0].title}" (${group.length} copies)`);
    console.log(`  Keeping:  ${keepId}`);
    console.log(`  Deleting: ${toDelete.map(m => m.id).join(', ')}`);

    const ids = toDelete.map(m => m.id);

    // Delete in dependency order
    await prisma.chapterNote.deleteMany({ where: { chapter: { manuscriptId: { in: ids } } } });
    await prisma.chapter.deleteMany({ where: { manuscriptId: { in: ids } } });
    await prisma.betaReader.deleteMany({ where: { manuscriptId: { in: ids } } });
    await prisma.formattingProject.deleteMany({ where: { manuscriptId: { in: ids } } });
    await prisma.product.updateMany({
      where: { manuscriptId: { in: ids } },
      data:  { manuscriptId: null },
    });
    // Manuscript delete cascades: BetaJoinRequest, ManuscriptVersion, ManuscriptVersionChapter
    await prisma.manuscript.deleteMany({ where: { id: { in: ids } } });

    totalDeleted += ids.length;
    void key;
  }

  if (totalDeleted === 0) {
    console.log('No duplicates found.');
  } else {
    console.log(`\nDone. Deleted ${totalDeleted} duplicate manuscript(s).`);
  }
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
