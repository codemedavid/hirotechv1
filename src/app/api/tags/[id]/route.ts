import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
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
    const { name, description, color } = body;

    const tag = await prisma.tag.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
      },
    });

    return NextResponse.json(tag);
  } catch (error: any) {
    console.error('Update tag error:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
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

    await prisma.tag.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete tag error:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}

