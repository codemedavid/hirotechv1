import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, contactIds, data } = await request.json();

    if (!action || !contactIds || !Array.isArray(contactIds)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Verify all contacts belong to user's organization
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        organizationId: session.user.organizationId,
      },
      select: { id: true, tags: true },
    });

    if (contacts.length !== contactIds.length) {
      return NextResponse.json(
        { error: 'Some contacts not found or unauthorized' },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case 'addTags':
        if (!data?.tags || !Array.isArray(data.tags)) {
          return NextResponse.json(
            { error: 'Tags array required' },
            { status: 400 }
          );
        }

        // Add tags to each contact
        await Promise.all(
          contacts.map(async (contact) => {
            const newTags = Array.from(
              new Set([...contact.tags, ...data.tags])
            );
            return prisma.contact.update({
              where: { id: contact.id },
              data: { tags: newTags },
            });
          })
        );

        // Update tag counts
        await Promise.all(
          data.tags.map((tag: string) =>
            prisma.tag.updateMany({
              where: {
                name: tag,
                organizationId: session.user.organizationId,
              },
              data: {
                contactCount: { increment: contactIds.length },
              },
            })
          )
        );

        // Log activities
        await prisma.contactActivity.createMany({
          data: contactIds.map((contactId) => ({
            contactId,
            type: 'TAG_ADDED',
            title: `Bulk tags added: ${data.tags.join(', ')}`,
            metadata: { tags: data.tags },
            userId: session.user.id,
          })),
        });

        result = { success: true, updated: contactIds.length };
        break;

      case 'removeTags':
        if (!data?.tags || !Array.isArray(data.tags)) {
          return NextResponse.json(
            { error: 'Tags array required' },
            { status: 400 }
          );
        }

        // Remove tags from each contact
        await Promise.all(
          contacts.map((contact) => {
            const newTags = contact.tags.filter(
              (tag) => !data.tags.includes(tag)
            );
            return prisma.contact.update({
              where: { id: contact.id },
              data: { tags: newTags },
            });
          })
        );

        // Update tag counts
        await Promise.all(
          data.tags.map((tag: string) =>
            prisma.tag.updateMany({
              where: {
                name: tag,
                organizationId: session.user.organizationId,
              },
              data: {
                contactCount: { decrement: contactIds.length },
              },
            })
          )
        );

        result = { success: true, updated: contactIds.length };
        break;

      case 'moveToStage':
        if (!data?.stageId) {
          return NextResponse.json(
            { error: 'Stage ID required' },
            { status: 400 }
          );
        }

        // Verify stage exists and belongs to organization
        const stage = await prisma.pipelineStage.findFirst({
          where: {
            id: data.stageId,
            pipeline: {
              organizationId: session.user.organizationId,
            },
          },
        });

        if (!stage) {
          return NextResponse.json(
            { error: 'Stage not found' },
            { status: 404 }
          );
        }

        // Move all contacts to stage
        await prisma.contact.updateMany({
          where: { id: { in: contactIds } },
          data: {
            stageId: data.stageId,
            stageEnteredAt: new Date(),
          },
        });

        // Log activities
        await prisma.contactActivity.createMany({
          data: contactIds.map((contactId) => ({
            contactId,
            type: 'STAGE_CHANGED',
            title: `Bulk moved to ${stage.name}`,
            toStageId: data.stageId,
            userId: session.user.id,
          })),
        });

        result = { success: true, updated: contactIds.length };
        break;

      case 'delete':
        // Delete all activities first
        await prisma.contactActivity.deleteMany({
          where: { contactId: { in: contactIds } },
        });

        // Delete contacts
        await prisma.contact.deleteMany({
          where: { id: { in: contactIds } },
        });

        result = { success: true, deleted: contactIds.length };
        break;

      case 'updateLeadScore':
        if (data?.leadScore === undefined) {
          return NextResponse.json(
            { error: 'Lead score required' },
            { status: 400 }
          );
        }

        await prisma.contact.updateMany({
          where: { id: { in: contactIds } },
          data: { leadScore: data.leadScore },
        });

        result = { success: true, updated: contactIds.length };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    const err = error as Error;
    console.error('Bulk action error:', err);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}

