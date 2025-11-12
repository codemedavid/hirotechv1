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

    const pipeline = await prisma.pipeline.findFirst({
      where: {
        id: id,
        organizationId: session.user.organizationId,
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            contacts: {
              take: 50,
              orderBy: { stageEnteredAt: 'desc' },
            },
            _count: {
              select: { contacts: true },
            },
          },
        },
      },
    });

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    return NextResponse.json(pipeline);
  } catch (error: unknown) {
    console.error('Get pipeline error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pipeline';
    return NextResponse.json(
      { error: errorMessage },
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

    await prisma.pipeline.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Delete pipeline error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete pipeline';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

