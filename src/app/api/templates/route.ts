import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get search query from URL params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    const templates = await prisma.template.findMany({
      where: { 
        organizationId: session.user.organizationId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
    });

    // Map templates with actual usage count from campaigns
    const templatesWithUsageCount = templates.map((template) => ({
      ...template,
      usageCount: template._count.campaigns,
      _count: undefined, // Remove _count from response
    }));

    return NextResponse.json(templatesWithUsageCount);
  } catch (error) {
    const err = error as Error;
    console.error('Get templates error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
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
    const { name, content, platform, category, recommendedTag } = body;

    const variables = (content.match(/\{(\w+)\}/g) || []).map((v: string) =>
      v.replace(/[{}]/g, '')
    );

    const template = await prisma.template.create({
      data: {
        name,
        content,
        variables,
        platform,
        category,
        recommendedTag,
        organizationId: session.user.organizationId,
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
    console.error('Create template error:', err);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

