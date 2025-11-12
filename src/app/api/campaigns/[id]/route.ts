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

    const campaign = await prisma.campaign.findUnique({
      where: { 
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        template: true,
        facebookPage: {
          select: {
            pageName: true,
            pageId: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    const err = error as Error;
    console.error('Get campaign error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the campaign (messages will be cascade deleted)
    await prisma.campaign.delete({
      where: { 
        id,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    console.error('Delete campaign error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}

