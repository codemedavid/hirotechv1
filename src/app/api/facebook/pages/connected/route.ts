import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/**
 * GET - Fetch organization's connected Facebook pages
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pages = await prisma.facebookPage.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch connected pages';
    console.error('Fetch connected pages error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

