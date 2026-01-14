import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

async function getLeaderboard() {
  // Get all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      createdAt: true,
    },
  });

  // Calculate equity for each user
  const leaderboardData = await Promise.all(
    users.map(async (user) => {
      // Get balance
      const latestLedger = await prisma.ledger.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      const balance = latestLedger ? Number(latestLedger.balanceAfter) : 0;

      // Get positions with current market prices
      const positions = await prisma.position.findMany({
        where: { userId: user.id },
        include: {
          song: {
            include: {
              marketState: true,
            },
          },
        },
      });

      const marketValue = positions.reduce((sum, position) => {
        const qty = Number(position.qty);
        const price = Number(position.song.marketState?.price || 0);
        return sum + qty * price;
      }, 0);

      const totalEquity = balance + marketValue;

      // Get trade count
      const tradeCount = await prisma.trade.count({
        where: { userId: user.id },
      });

      return {
        userId: user.id,
        username: user.username,
        balance,
        marketValue,
        totalEquity,
        tradeCount,
        createdAt: user.createdAt,
      };
    })
  );

  // Sort by total equity descending
  leaderboardData.sort((a, b) => b.totalEquity - a.totalEquity);

  return leaderboardData;
}

async function getTopTraderActivity() {
  // Get recent trades from top 10 traders
  const topTraders = await getLeaderboard();
  const topTraderIds = topTraders.slice(0, 10).map((t) => t.userId);

  const recentTrades = await prisma.trade.findMany({
    where: {
      userId: {
        in: topTraderIds,
      },
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
      song: {
        select: {
          id: true,
          title: true,
          artistName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  return recentTrades;
}

export default async function Leaderboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const leaderboard = await getLeaderboard();
  const topTraderActivity = await getTopTraderActivity();

  // Find current user's rank
  const currentUserRank =
    leaderboard.findIndex((u) => u.userId === session.user.id) + 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">Top traders and recent activity</p>
          {currentUserRank > 0 && (
            <p className="text-lg font-medium text-purple-600 mt-2">
              Your rank: #{currentUserRank}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Top 3 Traders Highlight */}
          {leaderboard.slice(0, 3).map((trader, index) => {
            const pnl = trader.totalEquity - 10000;
            const pnlPct = (pnl / 10000) * 100;
            const medals = ['🥇', '🥈', '🥉'];

            return (
              <div
                key={trader.userId}
                className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 text-white"
              >
                <div className="text-4xl mb-2">{medals[index]}</div>
                <div className="text-2xl font-bold mb-1">{trader.username}</div>
                <div className="text-sm opacity-90 mb-4">{trader.tradeCount} trades</div>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs opacity-75">Total Equity</div>
                    <div className="text-xl font-bold">${trader.totalEquity.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-75">P&L</div>
                    <div className="text-lg font-semibold">
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnl >= 0 ? '+' : ''}
                      {pnlPct.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Equity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cash
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trades
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P&L
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((user, index) => {
                const isCurrentUser = user.userId === session.user.id;
                const pnl = user.totalEquity - 10000; // Starting balance was $10,000
                const pnlPct = (pnl / 10000) * 100;

                return (
                  <tr
                    key={user.userId}
                    className={isCurrentUser ? 'bg-purple-50' : 'hover:bg-gray-50'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index < 3 && (
                          <span className="text-2xl mr-2">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                        <span
                          className={`text-lg font-bold ${
                            isCurrentUser ? 'text-purple-600' : 'text-gray-900'
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`font-medium ${
                          isCurrentUser ? 'text-purple-600' : 'text-gray-900'
                        }`}
                      >
                        {user.username}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-purple-600">(You)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ${user.totalEquity.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      ${user.balance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      ${user.marketValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                      {user.tradeCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div
                        className={`text-sm font-medium ${
                          pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </div>
                      <div
                        className={`text-xs ${
                          pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {pnl >= 0 ? '+' : ''}
                        {pnlPct.toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No traders yet</p>
          </div>
        )}

        {/* Top Trader Activity Feed */}
        {topTraderActivity.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">🔥 Top Trader Activity</h2>
              <p className="text-sm text-gray-600">See what the best traders are buying and selling</p>
            </div>
            <div className="divide-y divide-gray-200">
              {topTraderActivity.map((trade) => (
                <div key={trade.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-purple-600">
                          {trade.user.username}
                        </span>
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                            trade.side === 'BUY'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {trade.side}
                        </span>
                        <span className="text-sm text-gray-600">
                          {Number(trade.qty).toFixed(2)} shares
                        </span>
                      </div>
                      <Link
                        href={`/song/${trade.song.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-purple-600"
                      >
                        {trade.song.title}
                      </Link>
                      <div className="text-xs text-gray-500">{trade.song.artistName}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        ${Number(trade.price).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(trade.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
