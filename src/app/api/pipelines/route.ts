import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
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
  } catch (error: any) {
    console.error('Get pipelines error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, stages } = body;

    const pipeline = await prisma.pipeline.create({
      data: {
        name,
        description,
        color: color || '#3b82f6',
        organizationId: session.user.organizationId,
        stages: {
          create: stages.map((stage: any, index: number) => ({
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
  } catch (error: any) {
    console.error('Create pipeline error:', error);
    return NextResponse.json(
      { error: 'Failed to create pipeline' },
      { status: 500 }
    );
  }
}
