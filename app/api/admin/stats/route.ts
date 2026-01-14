import { NextResponse } from 'next/server';
import { getMarketStats } from '@/lib/market-tick';

export async function GET() {
  try {
    const stats = await getMarketStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
