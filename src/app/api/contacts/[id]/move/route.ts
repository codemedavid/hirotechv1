import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

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

    const { toStageId } = await request.json();
    const contactId = id;

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { stageId: true },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data: {
        stageId: toStageId,
        stageEnteredAt: new Date(),
      },
    });

    // Log activity
    await prisma.contactActivity.create({
      data: {
        contactId,
        type: 'STAGE_CHANGED',
        title: 'Contact moved to new stage',
        fromStageId: contact.stageId || undefined,
        toStageId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const err = error as Error;
    console.error('Move contact error:', err);
    return NextResponse.json(
      { error: 'Failed to move contact' },
      { status: 500 }
    );
  }
}

