import { NextRequest, NextResponse } from 'next/server';
import { runMarketTick } from '@/lib/market-tick';

export async function POST(request: NextRequest) {
  try {
    // Simple password protection for admin endpoint
    const body = await request.json();
    const { password } = body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await runMarketTick();

    return NextResponse.json({
      success: true,
      updatedCount: results.length,
      results: results.slice(0, 10), // Return first 10 for preview
    });
  } catch (error) {
    console.error('Market tick error:', error);
    return NextResponse.json(
      { error: 'Market tick failed' },
      { status: 500 }
    );
  }
}
