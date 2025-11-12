import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the campaign
    const campaign = await prisma.campaign.findUnique({
      where: { 
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status !== 'SENDING') {
      return NextResponse.json(
        { error: 'Campaign is not currently sending' },
        { status: 400 }
      );
    }

    // Update campaign status to PAUSED
    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'PAUSED',
      },
    });

    console.log(`⏸️  Campaign ${id} paused`);

    return NextResponse.json({ 
      success: true,
      campaign: updatedCampaign,
      message: 'Campaign paused successfully'
    });
  } catch (error) {
    const err = error as Error;
    console.error('❌ Stop campaign error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to stop campaign' },
      { status: 500 }
    );
  }
}

