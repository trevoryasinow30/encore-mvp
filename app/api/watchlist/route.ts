import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json({ error: 'songId is required' }, { status: 400 });
    }

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_songId: {
          userId: user.id,
          songId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Already in watchlist' });
    }

    // Add to watchlist
    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: user.id,
        songId,
      },
      include: {
        song: {
          include: {
            marketState: true,
          },
        },
      },
    });

    return NextResponse.json(watchlistItem);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json({ error: 'songId is required' }, { status: 400 });
    }

    // Remove from watchlist
    await prisma.watchlist.deleteMany({
      where: {
        userId: user.id,
        songId,
      },
    });

    return NextResponse.json({ message: 'Removed from watchlist' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const watchlist = await prisma.watchlist.findMany({
      where: {
        userId: user.id,
      },
      include: {
        song: {
          include: {
            marketState: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(watchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}
