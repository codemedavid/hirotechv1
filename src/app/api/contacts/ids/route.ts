import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/contacts/ids - Get all contact IDs matching filters
 * Used for "select all across pagination" feature
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
    const stageId = searchParams.get('stageId');
    const platform = searchParams.get('platform');
    const scoreRange = searchParams.get('scoreRange');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const pageId = searchParams.get('pageId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      organizationId: session.user.organizationId,
    };

    // Apply same filters as main contacts query
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tags) {
      const tagsArray = tags.split(',').filter(Boolean);
      if (tagsArray.length > 0) {
        where.AND = tagsArray.map((tag) => ({
          tags: { has: tag },
        }));
      }
    }

    if (stageId) {
      where.stageId = stageId;
    }

    if (pageId) {
      where.facebookPageId = pageId;
    }

    if (platform === 'messenger') {
      where.hasMessenger = true;
    } else if (platform === 'instagram') {
      where.hasInstagram = true;
    } else if (platform === 'both') {
      where.hasMessenger = true;
      where.hasInstagram = true;
    }

    if (scoreRange) {
      const [min, max] = scoreRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        where.leadScore = {
          gte: min,
          lte: max,
        };
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Get all matching contact IDs
    const contacts = await prisma.contact.findMany({
      where,
      select: { id: true },
    });

    return NextResponse.json({
      contactIds: contacts.map((c) => c.id),
      total: contacts.length,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Get contact IDs error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch contact IDs' },
      { status: 500 }
    );
  }
}

