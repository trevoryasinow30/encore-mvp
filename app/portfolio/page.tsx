import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { getPortfolio } from '@/lib/trading';
import Link from 'next/link';

export default async function Portfolio() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const portfolio = await getPortfolio(session.user.id);

  const totalPnL = portfolio.positions.reduce((sum: number, p: typeof portfolio.positions[number]) => sum + p.unrealizedPnL, 0);
  const totalCostBasis = portfolio.positions.reduce(
    (sum: number, p: typeof portfolio.positions[number]) => sum + p.qty * p.avgCost,
    0
  );
  const totalPnLPct =
    totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Portfolio</h1>
          <p className="text-gray-600">Track your positions and performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Cash Balance</p>
            <p className="text-3xl font-bold text-gray-900">
              ${portfolio.balance.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Market Value</p>
            <p className="text-3xl font-bold text-gray-900">
              ${portfolio.totalMarketValue.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Equity</p>
            <p className="text-3xl font-bold text-gray-900">
              ${portfolio.totalEquity.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total P&L</p>
            <p
              className={`text-3xl font-bold ${
                totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </p>
            <p
              className={`text-sm font-medium ${
                totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {totalPnL >= 0 ? '+' : ''}
              {totalPnLPct.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Positions Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Positions</h2>
          </div>

          {portfolio.positions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">You don&apos;t have any positions yet</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Browse Markets
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Song
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Cost
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Market Value
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P&L
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P&L %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {portfolio.positions.map((position: typeof portfolio.positions[number]) => (
                    <tr key={position.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/song/${position.songId}`}
                          className="text-purple-600 hover:text-purple-800 font-medium"
                        >
                          <div className="font-medium text-gray-900">
                            {position.song.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {position.song.artistName}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {position.qty.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        ${position.avgCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        ${position.currentPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        ${position.marketValue.toFixed(2)}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                          position.unrealizedPnL >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {position.unrealizedPnL >= 0 ? '+' : ''}$
                        {position.unrealizedPnL.toFixed(2)}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                          position.unrealizedPnLPct >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {position.unrealizedPnLPct >= 0 ? '+' : ''}
                        {position.unrealizedPnLPct.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
