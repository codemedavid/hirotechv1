import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { syncContacts } from '@/lib/facebook/sync-contacts';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { facebookPageId } = body;

    if (!facebookPageId) {
      return NextResponse.json(
        { error: 'Missing facebookPageId' },
        { status: 400 }
      );
    }

    const result = await syncContacts(facebookPageId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync contacts';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

