import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { getPageAccessToken, getInstagramBusinessAccount } from '@/lib/facebook/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userAccessToken, pageId } = body;

    if (!userAccessToken || !pageId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get page access token
    const { pageAccessToken, pageName } = await getPageAccessToken(
      userAccessToken,
      pageId
    );

    // Get Instagram business account if connected
    const igAccount = await getInstagramBusinessAccount(pageAccessToken);

    // Save to database
    const facebookPage = await prisma.facebookPage.create({
      data: {
        pageId,
        pageName,
        pageAccessToken,
        instagramAccountId: igAccount?.id,
        instagramUsername: igAccount?.username,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      page: {
        id: facebookPage.id,
        name: facebookPage.pageName,
        hasInstagram: !!facebookPage.instagramAccountId,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('Facebook auth error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to connect Facebook page' },
      { status: 500 }
    );
  }
}

