import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { startCampaign } from '@/lib/campaigns/send';

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

    // Verify campaign belongs to user's organization
    const campaign = await prisma.campaign.findUnique({
      where: { 
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Only allow resending completed, sent, or cancelled campaigns
    const allowedStatuses = ['COMPLETED', 'SENT', 'CANCELLED', 'PAUSED'];
    if (!allowedStatuses.includes(campaign.status)) {
      return NextResponse.json(
        { error: `Campaign cannot be resent. Current status: ${campaign.status}` }, 
        { status: 400 }
      );
    }

    console.log(`🔄 Resending campaign ${id}...`);

    // Reset campaign counters and status
    await prisma.campaign.update({
      where: { id },
      data: { 
        status: 'DRAFT',
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        repliedCount: 0,
        startedAt: null,
        completedAt: null,
      },
    });

    // Delete previous campaign messages (optional - you might want to keep history)
    await prisma.message.deleteMany({
      where: { campaignId: id },
    });

    console.log(`🗑️  Previous campaign messages cleared`);

    // Start the campaign again
    const result = await startCampaign(id);
    console.log(`✅ Campaign resent successfully`, result);

    return NextResponse.json({
      ...result,
      resent: true,
    });
  } catch (error) {
    const err = error as Error;
    console.error('❌ Resend campaign error:', err);
    
    // Try to update campaign status to CANCELLED if it got stuck
    try {
      const { id } = await props.params;
      await prisma.campaign.update({
        where: { id },
        data: { 
          status: 'CANCELLED',
          completedAt: new Date(),
        },
      });
      console.log(`🔄 Campaign ${id} status updated to CANCELLED due to error`);
    } catch (updateError) {
      console.error('Failed to update campaign status:', updateError);
    }

    return NextResponse.json(
      { error: err.message || 'Failed to resend campaign' },
      { status: 500 }
    );
  }
}

