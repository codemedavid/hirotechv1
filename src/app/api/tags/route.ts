import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(tags);
  } catch (error: unknown) {
    console.error('Get tags error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tags';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      name?: string;
      description?: string;
      color?: string;
    };
    const { name, description, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        description,
        color: color || '#64748b',
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(tag);
  } catch (error: unknown) {
    // Check if it's a Prisma unique constraint error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 400 }
      );
    }
    console.error('Create tag error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create tag';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

