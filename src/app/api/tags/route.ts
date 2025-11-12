import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
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
  } catch (error: any) {
    console.error('Get tags error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
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
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 400 }
      );
    }
    console.error('Create tag error:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}

