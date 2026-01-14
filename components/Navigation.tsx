'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  if (!session) {
    return null;
  }

  return (
    <nav className="bg-gradient-to-r from-purple-900 to-pink-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold">
              Encore
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/')
                    ? 'bg-purple-800'
                    : 'hover:bg-purple-800'
                }`}
              >
                Markets
              </Link>
              <Link
                href="/watchlist"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/watchlist')
                    ? 'bg-purple-800'
                    : 'hover:bg-purple-800'
                }`}
              >
                Watchlist
              </Link>
              <Link
                href="/portfolio"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/portfolio')
                    ? 'bg-purple-800'
                    : 'hover:bg-purple-800'
                }`}
              >
                Portfolio
              </Link>
              <Link
                href="/history"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/history')
                    ? 'bg-purple-800'
                    : 'hover:bg-purple-800'
                }`}
              >
                History
              </Link>
              <Link
                href="/leaderboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/leaderboard')
                    ? 'bg-purple-800'
                    : 'hover:bg-purple-800'
                }`}
              >
                Leaderboard
              </Link>
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/admin')
                    ? 'bg-purple-800'
                    : 'hover:bg-purple-800'
                }`}
              >
                Admin
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <span className="text-sm">{session.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
