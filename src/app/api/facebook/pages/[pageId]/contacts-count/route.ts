import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { pageId } = params;

    // Verify the page belongs to the user's organization
    const page = await prisma.facebookPage.findFirst({
      where: {
        id: pageId,
        organizationId: session.user.organizationId,
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Get contact count for this page
    const count = await prisma.contact.count({
      where: {
        facebookPageId: pageId,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching contact count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact count' },
      { status: 500 }
    );
  }
}

