import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { getSyncJobStatus } from '@/lib/facebook/background-sync';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { jobId } = params;

    const job = await getSyncJobStatus(jobId);

    // Verify the job belongs to a page in the user's organization
    const page = await prisma.facebookPage.findFirst({
      where: {
        id: job.facebookPageId,
        organizationId: session.user.organizationId,
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Unauthorized access to sync job' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      syncedContacts: job.syncedContacts,
      failedContacts: job.failedContacts,
      totalContacts: job.totalContacts,
      tokenExpired: job.tokenExpired,
      errors: job.errors,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sync status';
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

