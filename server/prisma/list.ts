import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const ms = await prisma.manuscript.findMany({
    select: { id: true, title: true, betaMode: true, createdAt: true,
      _count: { select: { chapters: true } } },
    orderBy: { createdAt: 'asc' },
  });
  ms.forEach(m =>
    console.log(`${m.id}  |  "${m.title}"  |  chapters: ${m._count.chapters}  |  betaMode: ${m.betaMode}  |  created: ${m.createdAt.toISOString()}`)
  );
}
main().finally(() => prisma.$disconnect());
