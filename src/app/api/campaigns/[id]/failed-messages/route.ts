import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the campaign first to verify ownership
    const campaign = await prisma.campaign.findUnique({
      where: { 
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get all failed messages for this campaign
    const failedMessages = await prisma.message.findMany({
      where: {
        campaignId: id,
        status: 'FAILED',
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            messengerPSID: true,
            instagramSID: true,
          },
        },
      },
      orderBy: {
        failedAt: 'desc',
      },
    });

    return NextResponse.json({
      failedMessages,
      count: failedMessages.length,
    });
  } catch (error) {
    const err = error as Error;
    console.error('❌ Get failed messages error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch failed messages' },
      { status: 500 }
    );
  }
}

