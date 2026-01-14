import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { prisma } from '@/lib/prisma';

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

      return {
        userId: user.id,
        username: user.username,
        balance,
        marketValue,
        totalEquity,
        createdAt: user.createdAt,
      };
    })
  );

  // Sort by total equity descending
  leaderboardData.sort((a, b) => b.totalEquity - a.totalEquity);

  return leaderboardData;
}

export default async function Leaderboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const leaderboard = await getLeaderboard();

  // Find current user's rank
  const currentUserRank =
    leaderboard.findIndex((u) => u.userId === session.user.id) + 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leaderboard</h1>
          <p className="text-gray-600">Top traders by total equity</p>
          {currentUserRank > 0 && (
            <p className="text-lg font-medium text-purple-600 mt-2">
              Your rank: #{currentUserRank}
            </p>
          )}
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
      </main>
    </div>
  );
}
