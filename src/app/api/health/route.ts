import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      database: { status: 'unknown', details: '' },
      prisma: { status: 'unknown', details: '' },
      environment: { status: 'unknown', details: '' },
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      nextVersion: process.env.npm_package_version || 'unknown',
    },
    requiredEnvVars: {} as Record<string, boolean>,
  };

  // Check Database Connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database.status = 'healthy';
    checks.services.database.details = 'Database connection successful';
  } catch (error) {
    checks.services.database.status = 'unhealthy';
    checks.services.database.details = error instanceof Error ? error.message : 'Database connection failed';
    checks.status = 'unhealthy';
  }

  // Check Prisma Client
  try {
    const userCount = await prisma.user.count();
    checks.services.prisma.status = 'healthy';
    checks.services.prisma.details = `Prisma client operational (${userCount} users)`;
  } catch (error) {
    checks.services.prisma.status = 'unhealthy';
    checks.services.prisma.details = error instanceof Error ? error.message : 'Prisma client error';
    checks.status = 'unhealthy';
  }

  // Check Required Environment Variables
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
  ];

  const optionalVars = [
    'REDIS_URL',
    'NEXT_PUBLIC_APP_URL',
    'FACEBOOK_WEBHOOK_VERIFY_TOKEN',
  ];

  requiredVars.forEach(varName => {
    checks.requiredEnvVars[varName] = !!process.env[varName];
    if (!process.env[varName]) {
      checks.status = 'unhealthy';
      checks.services.environment.status = 'unhealthy';
      checks.services.environment.details = 'Missing required environment variables';
    }
  });

  const optionalEnvVars: Record<string, boolean> = {};
  optionalVars.forEach(varName => {
    optionalEnvVars[varName] = !!process.env[varName];
  });

  if (checks.services.environment.status === 'unknown') {
    checks.services.environment.status = 'healthy';
    checks.services.environment.details = 'All required environment variables present';
  }

  const response = {
    ...checks,
    optionalEnvVars,
    warnings: [] as string[],
  };

  // Add warnings for missing optional variables
  if (!process.env.REDIS_URL) {
    response.warnings.push('REDIS_URL not set - Campaign sending will not work');
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    response.warnings.push('NEXT_PUBLIC_APP_URL not set - OAuth redirects may fail');
  }

  return NextResponse.json(response, {
    status: checks.status === 'healthy' ? 200 : 503,
  });
}

