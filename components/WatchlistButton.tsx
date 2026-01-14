'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WatchlistButtonProps {
  songId: string;
  initialIsWatched?: boolean;
}

export function WatchlistButton({ songId, initialIsWatched = false }: WatchlistButtonProps) {
  const [isWatched, setIsWatched] = useState(initialIsWatched);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const toggleWatchlist = async () => {
    setIsLoading(true);
    try {
      const method = isWatched ? 'DELETE' : 'POST';
      const response = await fetch('/api/watchlist', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update watchlist');
      }

      setIsWatched(!isWatched);
      router.refresh();
    } catch (error) {
      console.error('Error updating watchlist:', error);
      alert('Failed to update watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWatchlist}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isWatched
          ? 'bg-purple-600 text-white hover:bg-purple-700'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <svg
        className="w-5 h-5"
        fill={isWatched ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
      {isLoading ? 'Loading...' : isWatched ? 'Watching' : 'Watch'}
    </button>
  );
}
