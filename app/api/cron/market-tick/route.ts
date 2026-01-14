import { NextResponse } from 'next/server';
import { runMarketTick } from '@/lib/market-tick';

// This endpoint can be called by cron services or manually
export async function POST(request: Request) {
  try {
    // Optional: Add authentication/authorization here
    // For example, check for a secret token in headers
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Running scheduled market tick...');
    const result = await runMarketTick();

    return NextResponse.json({
      success: true,
      message: 'Market tick completed',
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Market tick error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: 'Market tick endpoint. Use POST to trigger.',
    status: 'ready',
  });
}
