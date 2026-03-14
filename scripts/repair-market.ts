import 'dotenv/config';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { runMarketTick } from '../lib/market-tick';

async function main() {
  const [marketCount, floorCount, historyCount] = await Promise.all([
    prisma.marketState.count(),
    prisma.marketState.count({
      where: {
        price: new Decimal('0.50'),
      },
    }),
    prisma.priceHistory.count(),
  ]);

  const needsRepair = marketCount > 0 && floorCount === marketCount && historyCount === 0;

  if (!needsRepair) {
    console.log('ℹ️  Market repair not needed.');
    return;
  }

  console.log('🛠️  Repairing flattened demo market...');

  await prisma.marketState.updateMany({
    data: {
      price: new Decimal('1.00'),
      change24hPct: new Decimal('0.00'),
      volume24h: new Decimal('0.00'),
      traders24h: 0,
      tags: [],
      lastUpdatedAt: new Date(),
    },
  });

  const results = await runMarketTick();
  console.log(`✅ Market repaired. Repriced ${results.length} songs and created fresh history.`);
}

main()
  .catch((error) => {
    console.error('❌ Market repair failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
