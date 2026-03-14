'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Navigation } from '@/components/Navigation';

export default function Admin() {
  const { data: session } = useSession();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [marketStats, setMarketStats] = useState<any>(null);

  useEffect(() => {
    if (session) {
      fetchMarketStats();
    }
  }, [session]);

  const fetchMarketStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setMarketStats(data);
    } catch (err) {
      console.error('Failed to fetch market stats:', err);
    }
  };

  const runMarketTick = async () => {
    if (!password.trim()) {
      setMessage('Enter the admin password before running a market tick.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/market-tick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to run market tick');
      }

      setMessage(`✅ Market tick completed! Updated ${data.updatedCount} songs.`);
      fetchMarketStats();
    } catch (err) {
      setMessage(`❌ Error: ${err instanceof Error ? err.message : 'Failed to run market tick'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to access the admin panel</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage market operations and view statistics</p>
        </div>

        {/* Market Stats */}
        {marketStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Total Songs</p>
              <p className="text-3xl font-bold text-gray-900">
                {marketStats.totalSongs}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Recent Listening Delta</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(marketStats.totalVolume || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-1">Avg Price</p>
              <p className="text-3xl font-bold text-gray-900">
                ${marketStats.avgPrice?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        )}

        {/* Market Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Market Controls</h2>

          <div className="space-y-4">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="admin123"
              />
              <p className="text-sm text-gray-600 mt-2">
                Default local password: <code>admin123</code>
              </p>
            </div>

            <div>
              <button
                onClick={runMarketTick}
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Running Market Tick...' : '🔄 Run Market Tick Now'}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Updates prices from cached Last.fm listening data and any recent Encore trades.
              </p>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.startsWith('✅')
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Setup</h2>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Initial Setup</h3>
              <p className="text-sm text-blue-800 mb-3">
                Use the repo bootstrap scripts instead of running setup pieces manually:
              </p>
              <div className="bg-blue-900 text-blue-100 p-3 rounded font-mono text-sm overflow-x-auto">
                <div># First run</div>
                <div>./start.sh</div>
                <div className="mt-2"># If you only want bootstrap without starting dev mode</div>
                <div>bash setup.sh</div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">Market Tick Automation</h3>
              <p className="text-sm text-purple-800">
                In production, set up a cron job or scheduled task to call the market tick
                endpoint every 1-5 minutes to keep prices moving.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Configuration</h3>
              <p className="text-sm text-gray-700 mb-2">
                Market parameters can be adjusted in:
              </p>
              <code className="text-xs bg-gray-800 text-gray-100 px-2 py-1 rounded">
                lib/market-tick.ts
              </code>
              <ul className="text-sm text-gray-700 mt-2 ml-4 list-disc">
                <li>LIQUIDITY_CONSTANT: Higher = less volatile (default: 10000)</li>
                <li>MAX_STEP: Maximum price change per tick (default: 15%)</li>
                <li>MIN_PRICE: Minimum price floor (default: $0.05)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
