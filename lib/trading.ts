import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function getUserBalance(userId: string): Promise<number> {
  const latestLedger = await prisma.ledger.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return latestLedger ? Number(latestLedger.balanceAfter) : 0;
}

export async function getUserPosition(userId: string, songId: string) {
  return await prisma.position.findUnique({
    where: {
      userId_songId: {
        userId,
        songId,
      },
    },
  });
}

export async function executeTrade(
  userId: string,
  songId: string,
  side: 'BUY' | 'SELL',
  qty: number
) {
  // Use a transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    // Get current market price
    const marketState = await tx.marketState.findUnique({
      where: { songId },
    });

    if (!marketState) {
      throw new Error('Market not found');
    }

    const price = Number(marketState.price);
    const total = qty * price;

    // Get current balance
    const latestLedger = await tx.ledger.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const currentBalance = latestLedger ? Number(latestLedger.balanceAfter) : 0;

    if (side === 'BUY') {
      // Verify user has enough cash
      if (currentBalance < total) {
        throw new Error('Insufficient funds');
      }

      // Create trade record
      const trade = await tx.trade.create({
        data: {
          userId,
          songId,
          side,
          qty: new Decimal(qty),
          price: new Decimal(price),
          total: new Decimal(total),
        },
      });

      // Update ledger (deduct cash)
      await tx.ledger.create({
        data: {
          userId,
          type: 'TRADE',
          amount: new Decimal(-total),
          balanceAfter: new Decimal(currentBalance - total),
          description: `Bought ${qty} shares`,
        },
      });

      // Update or create position
      const existingPosition = await tx.position.findUnique({
        where: {
          userId_songId: {
            userId,
            songId,
          },
        },
      });

      if (existingPosition) {
        const existingQty = Number(existingPosition.qty);
        const existingAvgCost = Number(existingPosition.avgCost);
        const newQty = existingQty + qty;
        const newAvgCost = (existingQty * existingAvgCost + qty * price) / newQty;

        await tx.position.update({
          where: {
            userId_songId: {
              userId,
              songId,
            },
          },
          data: {
            qty: new Decimal(newQty),
            avgCost: new Decimal(newAvgCost),
          },
        });
      } else {
        await tx.position.create({
          data: {
            userId,
            songId,
            qty: new Decimal(qty),
            avgCost: new Decimal(price),
          },
        });
      }

      return trade;
    } else {
      // SELL
      // Verify user has enough shares
      const position = await tx.position.findUnique({
        where: {
          userId_songId: {
            userId,
            songId,
          },
        },
      });

      if (!position || Number(position.qty) < qty) {
        throw new Error('Insufficient shares');
      }

      // Create trade record
      const trade = await tx.trade.create({
        data: {
          userId,
          songId,
          side,
          qty: new Decimal(qty),
          price: new Decimal(price),
          total: new Decimal(total),
        },
      });

      // Update ledger (add cash)
      await tx.ledger.create({
        data: {
          userId,
          type: 'TRADE',
          amount: new Decimal(total),
          balanceAfter: new Decimal(currentBalance + total),
          description: `Sold ${qty} shares`,
        },
      });

      // Update position
      const newQty = Number(position.qty) - qty;

      if (newQty > 0.001) {
        // Keep position if qty > 0
        await tx.position.update({
          where: {
            userId_songId: {
              userId,
              songId,
            },
          },
          data: {
            qty: new Decimal(newQty),
          },
        });
      } else {
        // Delete position if fully sold
        await tx.position.delete({
          where: {
            userId_songId: {
              userId,
              songId,
            },
          },
        });
      }

      return trade;
    }
  });
}

export async function getPortfolio(userId: string) {
  const positions = await prisma.position.findMany({
    where: { userId },
    include: {
      song: {
        include: {
          marketState: true,
        },
      },
    },
  });

  const balance = await getUserBalance(userId);

  const positionsWithPnL = positions.map((position) => {
    const qty = Number(position.qty);
    const avgCost = Number(position.avgCost);
    const currentPrice = Number(position.song.marketState?.price || 0);
    const marketValue = qty * currentPrice;
    const costBasis = qty * avgCost;
    const unrealizedPnL = marketValue - costBasis;
    const unrealizedPnLPct = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

    return {
      ...position,
      qty,
      avgCost,
      currentPrice,
      marketValue,
      unrealizedPnL,
      unrealizedPnLPct,
    };
  });

  const totalMarketValue = positionsWithPnL.reduce((sum, p) => sum + p.marketValue, 0);
  const totalEquity = balance + totalMarketValue;

  return {
    balance,
    positions: positionsWithPnL,
    totalMarketValue,
    totalEquity,
  };
}
