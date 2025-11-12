import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/**
 * Manually mark a campaign as COMPLETED
 * Useful for fixing stuck campaigns that are in SENDING status
 * but have already processed all messages
 */
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

    // Get campaign with full details
    const campaign = await prisma.campaign.findUnique({
      where: { 
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check if campaign is in a valid state to be marked complete
    if (campaign.status !== 'SENDING') {
      return NextResponse.json({
        error: `Campaign is already ${campaign.status}`,
        currentStatus: campaign.status,
      }, { status: 400 });
    }

    // Calculate total processed
    const totalProcessed = campaign.sentCount + campaign.failedCount;
    
    // Verify all messages have been processed
    if (totalProcessed < campaign.totalRecipients) {
      return NextResponse.json({
        error: `Campaign is not fully processed yet`,
        details: {
          totalRecipients: campaign.totalRecipients,
          sentCount: campaign.sentCount,
          failedCount: campaign.failedCount,
          processed: totalProcessed,
          remaining: campaign.totalRecipients - totalProcessed,
        },
      }, { status: 400 });
    }

    console.log(`🔧 Manually marking campaign ${id} as COMPLETED`, {
      name: campaign.name,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
    });

    // Force completion
    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    console.log(`✅ Campaign ${id} manually marked as COMPLETED`);

    return NextResponse.json({
      success: true,
      message: 'Campaign marked as completed',
      campaign: updated,
    });
  } catch (error) {
    const err = error as Error;
    console.error('❌ Mark complete error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to mark campaign as complete' },
      { status: 500 }
    );
  }
}

