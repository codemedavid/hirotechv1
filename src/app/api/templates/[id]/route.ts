import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, content, platform, category, recommendedTag } = body;

    // Verify the template belongs to the user's organization
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Extract variables from content
    const variables = (content.match(/\{(\w+)\}/g) || []).map((v: string) =>
      v.replace(/[{}]/g, '')
    );

    const template = await prisma.template.update({
      where: { id },
      data: {
        name,
        content,
        variables,
        platform,
        category,
        recommendedTag,
      },
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
    });

    return NextResponse.json({
      ...template,
      usageCount: template._count.campaigns,
      _count: undefined,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Update template error:', err);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify the template belongs to the user's organization
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if template is being used by any campaigns
    const campaignsUsingTemplate = await prisma.campaign.count({
      where: { templateId: id },
    });

    if (campaignsUsingTemplate > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete template. It is currently used by ${campaignsUsingTemplate} campaign(s)`,
        },
        { status: 400 }
      );
    }

    await prisma.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}

