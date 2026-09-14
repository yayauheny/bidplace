const {
  assertFigmaComparisonTarget,
  syncFigmaComparisonFixture,
} = require('./figma-comparison-fixture');

const printTargetOnly = process.argv.includes('--print-target-only');

function mainError(error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

let databaseName;
try {
  databaseName = assertFigmaComparisonTarget(process.env.DATABASE_URL);
  console.log(`Target disposable database: ${databaseName}`);
  if (printTargetOnly) {
    process.exit(0);
  }
} catch (error) {
  mainError(error);
}

const { PrismaClient } = require('../dist');
const prisma = new PrismaClient();

syncFigmaComparisonFixture(prisma)
  .then((summary) => {
    console.log(
      `Synced Figma comparison author ${summary.slug} works ${summary.publicIds.join(', ')} curatorSelection ${summary.curatorSelectionPublicId}`,
    );
  })
  .catch(mainError)
  .finally(async () => {
    await prisma.$disconnect();
  });
