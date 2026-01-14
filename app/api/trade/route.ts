import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeTrade } from '@/lib/trading';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { songId, side, qty } = body;

    // Validation
    if (!songId || !side || !qty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (side !== 'BUY' && side !== 'SELL') {
      return NextResponse.json({ error: 'Invalid side' }, { status: 400 });
    }

    const qtyNum = parseFloat(qty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Execute trade
    const trade = await executeTrade(session.user.id, songId, side, qtyNum);

    return NextResponse.json({ success: true, trade });
  } catch (error) {
    console.error('Trade execution error:', error);
    const message = error instanceof Error ? error.message : 'Trade execution failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
