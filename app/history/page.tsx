import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

async function getTradeHistory(userId: string) {
  const trades = await prisma.trade.findMany({
    where: {
      userId,
    },
    include: {
      song: {
        include: {
          marketState: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100, // Last 100 trades
  });

  return trades;
}

async function getAnalytics(userId: string) {
  const trades = await prisma.trade.findMany({
    where: {
      userId,
    },
    include: {
      song: {
        include: {
          marketState: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const positions = await prisma.position.findMany({
    where: {
      userId,
    },
    include: {
      song: {
        include: {
          marketState: true,
        },
      },
    },
  });

  // Calculate P&L for closed positions (buy then sell)
  const tradesBySong: Record<string, typeof trades> = {};
  trades.forEach((trade: typeof trades[number]) => {
    if (!tradesBySong[trade.songId]) {
      tradesBySong[trade.songId] = [];
    }
    tradesBySong[trade.songId].push(trade);
  });

  let totalRealizedPnL = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  const pnlBySong: Record<string, { pnl: number; song: any }> = {};

  Object.entries(tradesBySong).forEach(([songId, songTrades]) => {
    let shares = 0;
    let costBasis = 0;
    let realizedPnL = 0;

    songTrades.forEach((trade: typeof trades[number]) => {
      if (trade.side === 'BUY') {
        shares += Number(trade.qty);
        costBasis += Number(trade.total);
      } else if (trade.side === 'SELL') {
        const avgCost = shares > 0 ? costBasis / shares : 0;
        const sellPnL = Number(trade.total) - avgCost * Number(trade.qty);
        realizedPnL += sellPnL;

        if (sellPnL > 0) winningTrades++;
        if (sellPnL < 0) losingTrades++;

        shares -= Number(trade.qty);
        if (shares > 0) {
          costBasis -= avgCost * Number(trade.qty);
        } else {
          costBasis = 0;
        }
      }
    });

    totalRealizedPnL += realizedPnL;
    if (songTrades.length > 0) {
      pnlBySong[songId] = {
        pnl: realizedPnL,
        song: songTrades[0].song,
      };
    }
  });

  // Calculate unrealized P&L from current positions
  let totalUnrealizedPnL = 0;
  positions.forEach((pos: typeof positions[number]) => {
    const currentPrice = Number(pos.song.marketState?.price || 0);
    const avgCost = Number(pos.avgCost);
    const shares = Number(pos.qty);
    const unrealizedPnL = (currentPrice - avgCost) * shares;
    totalUnrealizedPnL += unrealizedPnL;
  });

  // Best and worst trades
  const pnlArray = Object.values(pnlBySong);
  const bestTrades = pnlArray.sort((a, b) => b.pnl - a.pnl).slice(0, 5);
  const worstTrades = pnlArray.sort((a, b) => a.pnl - b.pnl).slice(0, 5);

  const winRate =
    winningTrades + losingTrades > 0
      ? (winningTrades / (winningTrades + losingTrades)) * 100
      : 0;

  return {
    totalRealizedPnL,
    totalUnrealizedPnL,
    totalPnL: totalRealizedPnL + totalUnrealizedPnL,
    winningTrades,
    losingTrades,
    winRate,
    bestTrades,
    worstTrades,
  };
}

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/history');
  }

  const trades = await getTradeHistory(session.user.id);
  const analytics = await getAnalytics(session.user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Trading History</h1>
          <p className="text-gray-600">Your complete trading record and performance analytics</p>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total P&L</div>
            <div
              className={`text-3xl font-bold ${
                analytics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {analytics.totalPnL >= 0 ? '+' : ''}${analytics.totalPnL.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Realized: ${analytics.totalRealizedPnL.toFixed(2)} | Unrealized: $
              {analytics.totalUnrealizedPnL.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Win Rate</div>
            <div className="text-3xl font-bold text-purple-600">
              {analytics.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {analytics.winningTrades}W / {analytics.losingTrades}L
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Trades</div>
            <div className="text-3xl font-bold text-gray-900">{trades.length}</div>
            <div className="text-xs text-gray-500 mt-2">Last 100 trades shown</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Best Trade</div>
            <div className="text-3xl font-bold text-green-600">
              {analytics.bestTrades[0] ? `+$${analytics.bestTrades[0].pnl.toFixed(2)}` : '$0.00'}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {analytics.bestTrades[0]?.song.title || 'No trades yet'}
            </div>
          </div>
        </div>

        {/* Best/Worst Trades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Best Trades */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 Best Trades</h2>
            {analytics.bestTrades.length === 0 ? (
              <p className="text-gray-500">No completed trades yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.bestTrades.map((trade, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{trade.song.title}</div>
                      <div className="text-sm text-gray-600">{trade.song.artistName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+${trade.pnl.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Worst Trades */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📉 Worst Trades</h2>
            {analytics.worstTrades.length === 0 ? (
              <p className="text-gray-500">No completed trades yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.worstTrades.map((trade, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{trade.song.title}</div>
                      <div className="text-sm text-gray-600">{trade.song.artistName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">${trade.pnl.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trade History Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Trades</h2>
          </div>
          {trades.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">No trades yet</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Start Trading
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Song
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Side
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trades.map((trade: typeof trades[number]) => {
                    const currentPrice = Number(trade.song.marketState?.price || 0);
                    const tradePrice = Number(trade.price);
                    const priceDiff = currentPrice - tradePrice;
                    const priceDiffPct =
                      tradePrice > 0 ? (priceDiff / tradePrice) * 100 : 0;

                    return (
                      <tr key={trade.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(trade.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/song/${trade.song.id}`}
                            className="text-sm font-medium text-purple-600 hover:text-purple-800"
                          >
                            {trade.song.title}
                          </Link>
                          <div className="text-xs text-gray-500">{trade.song.artistName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              trade.side === 'BUY'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {trade.side}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {Number(trade.qty).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ${Number(trade.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          ${Number(trade.total).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <div className="font-medium text-gray-900">
                            ${currentPrice.toFixed(2)}
                          </div>
                          <div
                            className={`text-xs ${
                              priceDiff >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {priceDiff >= 0 ? '+' : ''}
                            {priceDiffPct.toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
