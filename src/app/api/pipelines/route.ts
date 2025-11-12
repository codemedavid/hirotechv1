import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { StageType } from '@prisma/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pipelines = await prisma.pipeline.findMany({
      where: {
        organizationId: session.user.organizationId,
        isArchived: false,
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { contacts: true },
            },
          },
        },
      },
    });

    return NextResponse.json(pipelines);
  } catch (error: unknown) {
    console.error('Get pipelines error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pipelines';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

interface PipelineStage {
  name: string;
  color: string;
  type: StageType;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      name: string;
      description?: string;
      color?: string;
      stages: PipelineStage[];
    };
    const { name, description, color, stages } = body;

    const pipeline = await prisma.pipeline.create({
      data: {
        name,
        description,
        color: color || '#3b82f6',
        organizationId: session.user.organizationId,
        stages: {
          create: stages.map((stage, index: number) => ({
            name: stage.name,
            color: stage.color,
            type: stage.type,
            order: index,
          })),
        },
      },
      include: { stages: true },
    });

    return NextResponse.json(pipeline);
  } catch (error: unknown) {
    console.error('Create pipeline error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create pipeline';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
