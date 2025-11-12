import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { getLatestSyncJob } from '@/lib/facebook/background-sync';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { pageId } = params;

    // Verify the page belongs to the user's organization
    const page = await prisma.facebookPage.findFirst({
      where: {
        id: pageId,
        organizationId: session.user.organizationId,
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const latestJob = await getLatestSyncJob(pageId);

    if (!latestJob) {
      return NextResponse.json({ job: null });
    }

    return NextResponse.json({
      job: {
        id: latestJob.id,
        status: latestJob.status,
        syncedContacts: latestJob.syncedContacts,
        failedContacts: latestJob.failedContacts,
        totalContacts: latestJob.totalContacts,
        tokenExpired: latestJob.tokenExpired,
        startedAt: latestJob.startedAt,
        completedAt: latestJob.completedAt,
      createdAt: latestJob.createdAt,
    },
  });
  } catch (error) {
    console.error('Error fetching latest sync job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest sync job' },
      { status: 500 }
    );
  }
}

