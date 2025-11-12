import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: true,
        facebookPage: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    const err = error as Error;
    console.error('Get campaigns error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      platform,
      messageTag,
      facebookPageId,
      templateId,
      targetingType,
      targetTags,
      targetStageIds,
      targetContactIds,
      rateLimit,
    } = body;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        platform,
        messageTag,
        facebookPageId,
        templateId,
        targetingType,
        targetTags: targetTags || [],
        targetStageIds: targetStageIds || [],
        targetContactIds: targetContactIds || [],
        rateLimit: rateLimit || 3600, // Default: 1 message per second
        organizationId: session.user.organizationId,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    const err = error as Error;
    console.error('Create campaign error:', err);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

