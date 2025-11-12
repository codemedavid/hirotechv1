import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { getUserPages, getPageAccessToken, getInstagramBusinessAccount } from '@/lib/facebook/auth';

interface SelectedPage {
  id: string;
  name: string;
}

/**
 * GET - Fetch user's Facebook pages
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userAccessToken = searchParams.get('token');

    if (!userAccessToken) {
      return NextResponse.json(
        { error: 'Missing user access token' },
        { status: 400 }
      );
    }

    // Fetch user's Facebook pages
    const pages = await getUserPages(userAccessToken);

    // Check which pages are already connected
    const existingPages = await prisma.facebookPage.findMany({
      where: {
        organizationId: session.user.organizationId,
        pageId: { in: pages.map((p) => p.id) },
      },
      select: { pageId: true },
    });

    const existingPageIds = new Set(existingPages.map(p => p.pageId));

    // Mark pages as already connected
    const pagesWithStatus = pages.map((page) => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token,
      isConnected: existingPageIds.has(page.id),
    }));

    return NextResponse.json({ pages: pagesWithStatus });
  } catch (error: unknown) {
    console.error('Fetch pages error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch Facebook pages';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST - Save selected Facebook pages
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as { selectedPages?: SelectedPage[]; userAccessToken?: string };
    const { selectedPages, userAccessToken } = body;

    if (!selectedPages || !Array.isArray(selectedPages) || selectedPages.length === 0) {
      return NextResponse.json(
        { error: 'No pages selected' },
        { status: 400 }
      );
    }

    if (!userAccessToken) {
      return NextResponse.json(
        { error: 'Missing user access token' },
        { status: 400 }
      );
    }

    interface SavedPage {
      id: string;
      pageId: string;
      pageName: string;
      instagramAccountId: string | null;
    }

    interface PageError {
      pageId: string;
      pageName: string;
      error: string;
    }

    const savedPages: SavedPage[] = [];
    const errors: PageError[] = [];

    // Process each selected page
    for (const page of selectedPages) {
      try {
        // Get page-specific access token
        const { pageAccessToken, pageName } = await getPageAccessToken(
          userAccessToken,
          page.id
        );

        // Check for Instagram business account
        const igAccount = await getInstagramBusinessAccount(pageAccessToken);

        // Check if page already exists
        const existingPage = await prisma.facebookPage.findFirst({
          where: {
            pageId: page.id,
            organizationId: session.user.organizationId,
          },
        });

        if (existingPage) {
          // Update existing page
          const updatedPage = await prisma.facebookPage.update({
            where: { id: existingPage.id },
            data: {
              pageName,
              pageAccessToken,
              instagramAccountId: igAccount?.id || null,
              instagramUsername: igAccount?.username || null,
              isActive: true,
              updatedAt: new Date(),
            },
          });
          savedPages.push(updatedPage);
        } else {
          // Create new page
          const newPage = await prisma.facebookPage.create({
            data: {
              pageId: page.id,
              pageName,
              pageAccessToken,
              instagramAccountId: igAccount?.id || null,
              instagramUsername: igAccount?.username || null,
              organizationId: session.user.organizationId,
            },
          });
          savedPages.push(newPage);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing page ${page.id}:`, error);
        errors.push({
          pageId: page.id,
          pageName: page.name,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      savedPages: savedPages.length,
      errors: errors.length > 0 ? errors : undefined,
      pages: savedPages.map(p => ({
        id: p.id,
        pageId: p.pageId,
        name: p.pageName,
        hasInstagram: !!p.instagramAccountId,
      })),
    });
  } catch (error: unknown) {
    console.error('Save pages error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save Facebook pages';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Disconnect a Facebook page
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json(
        { error: 'Missing page ID' },
        { status: 400 }
      );
    }

    // Delete the page (ensure it belongs to the user's organization)
    const deletedPage = await prisma.facebookPage.deleteMany({
      where: {
        id: pageId,
        organizationId: session.user.organizationId,
      },
    });

    if (deletedPage.count === 0) {
      return NextResponse.json(
        { error: 'Page not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete page error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect page';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

