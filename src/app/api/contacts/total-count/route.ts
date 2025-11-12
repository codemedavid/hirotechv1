import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total contact count for the user's organization
    const count = await prisma.contact.count({
      where: {
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching total contact count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch total contact count' },
      { status: 500 }
    );
  }
}

