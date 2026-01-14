'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TradeModuleProps {
  songId: string;
  currentPrice: number;
}

export function TradeModule({ songId, currentPrice }: TradeModuleProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [qty, setQty] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const router = useRouter();

  // Fetch user balance and position
  useEffect(() => {
    fetch('/api/portfolio')
      .then((res) => res.json())
      .then((data) => {
        setBalance(data.balance);
        const pos = data.positions.find((p: any) => p.songId === songId);
        setPosition(pos ? pos.qty : 0);
      })
      .catch((err) => {
        console.error('Failed to fetch portfolio:', err);
      });
  }, [songId, success]); // Refetch after successful trade

  const qtyNum = parseFloat(qty) || 0;
  const total = qtyNum * currentPrice;

  const handleTrade = async () => {
    setError('');
    setSuccess('');

    if (qtyNum <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (side === 'BUY' && balance !== null && total > balance) {
      setError('Insufficient funds');
      return;
    }

    if (side === 'SELL' && position !== null && qtyNum > position) {
      setError('Insufficient shares');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songId,
          side,
          qty: qtyNum,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Trade failed');
      }

      setSuccess(`Successfully ${side === 'BUY' ? 'bought' : 'sold'} ${qtyNum} shares!`);
      setQty('1');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Trade</h2>

      {/* Balance Display */}
      {balance !== null && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Cash Balance</p>
          <p className="text-lg font-bold text-gray-900">${balance.toFixed(2)}</p>
          {position !== null && position > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Shares Owned: {position.toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Buy/Sell Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setSide('BUY')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            side === 'BUY'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            side === 'SELL'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Quantity Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity
        </label>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          min="0"
          step="0.01"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter quantity"
        />
      </div>

      {/* Price Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Price per share</span>
          <span className="text-sm font-medium text-gray-900">
            ${currentPrice.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="font-medium text-gray-900">Total</span>
          <span className="font-bold text-gray-900">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Trade Button */}
      <button
        onClick={handleTrade}
        disabled={loading || qtyNum <= 0}
        className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
          side === 'BUY'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? 'Processing...' : `${side === 'BUY' ? 'Buy' : 'Sell'} Shares`}
      </button>
    </div>
  );
}
