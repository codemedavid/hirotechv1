import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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

    console.log(`🎯 API: Starting campaign ${id}`);
    const result = await startCampaign(id);
    console.log(`✅ API: Campaign started successfully`, result);

    return NextResponse.json(result);
  } catch (error) {
    const err = error as Error;
    console.error('❌ Start campaign error:', err);
    console.error('   Error details:', {
      message: err.message,
      stack: err.stack,
      campaignId: await props.params.then(p => p.id),
    });

    // Try to update campaign status to FAILED if it got stuck
    try {
      const { id } = await props.params;
      const { prisma } = await import('@/lib/db');
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
      { error: err.message || 'Failed to start campaign' },
      { status: 500 }
    );
  }
}
