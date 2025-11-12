import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateIds } = body;

    if (!Array.isArray(templateIds) || templateIds.length === 0) {
      return NextResponse.json(
        { error: 'Template IDs array is required' },
        { status: 400 }
      );
    }

    // Verify all templates belong to the user's organization
    const templates = await prisma.template.findMany({
      where: {
        id: { in: templateIds },
        organizationId: session.user.organizationId,
      },
    });

    if (templates.length !== templateIds.length) {
      return NextResponse.json(
        { error: 'Some templates not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if any template is being used by campaigns
    const campaignsUsingTemplates = await prisma.campaign.findMany({
      where: { templateId: { in: templateIds } },
      select: { templateId: true },
    });

    const templatesInUse = campaignsUsingTemplates.map((c) => c.templateId);
    const uniqueTemplatesInUse = [...new Set(templatesInUse)];

    if (uniqueTemplatesInUse.length > 0) {
      const templatesInUseNames = templates
        .filter((t) => uniqueTemplatesInUse.includes(t.id))
        .map((t) => t.name);

      return NextResponse.json(
        {
          error: `Cannot delete ${uniqueTemplatesInUse.length} template(s) that are currently used by campaigns`,
          templatesInUse: templatesInUseNames,
        },
        { status: 400 }
      );
    }

    // Delete all templates
    const result = await prisma.template.deleteMany({
      where: {
        id: { in: templateIds },
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error: any) {
    console.error('Bulk delete templates error:', error);
    return NextResponse.json(
      { error: 'Failed to delete templates' },
      { status: 500 }
    );
  }
}

