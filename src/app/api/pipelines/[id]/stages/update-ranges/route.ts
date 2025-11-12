import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

interface StageRange {
  stageId: string;
  leadScoreMin: number;
  leadScoreMax: number;
}

/**
 * POST /api/pipelines/[id]/stages/update-ranges
 * Update lead score ranges for multiple stages
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

    const body = await request.json();
    const { stageRanges } = body as { stageRanges: StageRange[] };

    if (!Array.isArray(stageRanges) || stageRanges.length === 0) {
      return NextResponse.json(
        { error: 'Invalid stage ranges provided' },
        { status: 400 }
      );
    }

    // Verify pipeline belongs to user's organization
    const pipeline = await prisma.pipeline.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    console.log(`[Update Ranges] Updating ${stageRanges.length} stage ranges for pipeline ${id}`);

    // Update each stage's score range
    await Promise.all(
      stageRanges.map(range =>
        prisma.pipelineStage.update({
          where: { id: range.stageId },
          data: {
            leadScoreMin: range.leadScoreMin,
            leadScoreMax: range.leadScoreMax,
          },
        })
      )
    );

    console.log(`[Update Ranges] Successfully updated all stage ranges`);

    return NextResponse.json({ 
      success: true,
      updated: stageRanges.length
    });
  } catch (error) {
    console.error('[Update Ranges] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update score ranges' },
      { status: 500 }
    );
  }
}

