#!/usr/bin/env tsx
/**
 * Diagnostic Script for Internal Server Errors
 * 
 * This script checks common issues that cause 500 errors:
 * - Environment variables
 * - Database connection
 * - Prisma client status
 * - Redis connection
 * - Running processes
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

const results: DiagnosticResult[] = [];

function addResult(
  name: string,
  status: 'pass' | 'fail' | 'warning',
  message: string,
  details?: string
) {
  results.push({ name, status, message, details });
}

function checkEnvironmentFile() {
  console.log('\n🔍 Checking environment files...');
  
  const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
  const foundFiles = envFiles.filter((file) => existsSync(join(process.cwd(), file)));
  
  if (foundFiles.length === 0) {
    addResult(
      'Environment File',
      'fail',
      'No .env file found',
      'Create .env.local with required variables'
    );
  } else {
    addResult(
      'Environment File',
      'pass',
      `Found: ${foundFiles.join(', ')}`,
      undefined
    );
  }
}

function checkEnvironmentVariables() {
  console.log('\n🔍 Checking environment variables...');
  
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'FACEBOOK_APP_ID',
    'FACEBOOK_APP_SECRET',
    'REDIS_URL',
  ];
  
  const missing: string[] = [];
  const found: string[] = [];
  
  required.forEach((varName) => {
    if (process.env[varName]) {
      found.push(varName);
    } else {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    addResult(
      'Environment Variables',
      'fail',
      `Missing ${missing.length} required variables`,
      `Missing: ${missing.join(', ')}`
    );
  } else {
    addResult(
      'Environment Variables',
      'pass',
      `All ${required.length} required variables present`,
      undefined
    );
  }
}

function checkPrismaClient() {
  console.log('\n🔍 Checking Prisma client...');
  
  const prismaClientPath = join(process.cwd(), 'node_modules', '.prisma', 'client');
  
  if (!existsSync(prismaClientPath)) {
    addResult(
      'Prisma Client',
      'fail',
      'Prisma client not generated',
      'Run: npx prisma generate'
    );
    return;
  }
  
  try {
    // Try to import and test Prisma client
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client') as { PrismaClient: new () => { $disconnect: () => Promise<void> } };
    const prisma = new PrismaClient();
    
    addResult(
      'Prisma Client',
      'pass',
      'Prisma client generated and importable',
      undefined
    );
    
    prisma.$disconnect().catch(() => {});
  } catch (error) {
    const err = error as Error;
    addResult(
      'Prisma Client',
      'fail',
      'Prisma client import failed',
      err.message
    );
  }
}

async function checkDatabaseConnection() {
  console.log('\n🔍 Checking database connection...');
  
  if (!process.env.DATABASE_URL) {
    addResult(
      'Database Connection',
      'fail',
      'DATABASE_URL not set',
      'Set DATABASE_URL in .env.local'
    );
    return;
  }
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client') as { PrismaClient: new () => { $connect: () => Promise<void>; $disconnect: () => Promise<void> } };
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    await prisma.$disconnect();
    
    addResult(
      'Database Connection',
      'pass',
      'Successfully connected to database',
      undefined
    );
  } catch (error) {
    const err = error as Error;
    addResult(
      'Database Connection',
      'fail',
      'Cannot connect to database',
      err.message
    );
  }
}

function checkRedisConnection() {
  console.log('\n🔍 Checking Redis connection...');
  
  if (!process.env.REDIS_URL) {
    addResult(
      'Redis Connection',
      'warning',
      'REDIS_URL not set',
      'Campaigns will not work without Redis'
    );
    return;
  }
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require('ioredis') as { new (url: string): { ping: (callback: (err: Error | null, result: string) => void) => void; disconnect: () => void } };
    const redis = new Redis(process.env.REDIS_URL);
    
    redis.ping((err: Error | null, result: string) => {
      if (err || result !== 'PONG') {
        addResult(
          'Redis Connection',
          'fail',
          'Cannot connect to Redis',
          err?.message || 'Redis did not respond with PONG'
        );
      } else {
        addResult(
          'Redis Connection',
          'pass',
          'Successfully connected to Redis',
          undefined
        );
      }
      redis.disconnect();
    });
  } catch (error) {
    const err = error as Error;
    addResult(
      'Redis Connection',
      'warning',
      'Redis connection check failed',
      err.message
    );
  }
}

function checkRunningProcesses() {
  console.log('\n🔍 Checking running Node.js processes...');
  
  try {
    const output = execSync('tasklist | findstr "node.exe"', { encoding: 'utf-8' });
    const lines = output.trim().split('\n').filter(Boolean);
    
    if (lines.length > 0) {
      addResult(
        'Running Processes',
        'warning',
        `Found ${lines.length} Node.js process(es)`,
        'Multiple processes may cause file locks. Run stop-all.bat if needed.'
      );
    } else {
      addResult(
        'Running Processes',
        'pass',
        'No Node.js processes running',
        undefined
      );
    }
  } catch (error) {
    console.error('Process check error:', error);
    addResult(
      'Running Processes',
      'pass',
      'No Node.js processes running',
      undefined
    );
  }
}

function checkNodeModules() {
  console.log('\n🔍 Checking node_modules...');
  
  const nodeModulesPath = join(process.cwd(), 'node_modules');
  
  if (!existsSync(nodeModulesPath)) {
    addResult(
      'Node Modules',
      'fail',
      'node_modules directory not found',
      'Run: npm install'
    );
    return;
  }
  
  const criticalPackages = [
    '@prisma/client',
    'next',
    'next-auth',
    'bcrypt',
    'ioredis',
    'bullmq',
  ];
  
  const missing = criticalPackages.filter(
    (pkg) => !existsSync(join(nodeModulesPath, pkg))
  );
  
  if (missing.length > 0) {
    addResult(
      'Node Modules',
      'fail',
      `Missing ${missing.length} critical package(s)`,
      `Missing: ${missing.join(', ')}`
    );
  } else {
    addResult(
      'Node Modules',
      'pass',
      'All critical packages installed',
      undefined
    );
  }
}

function checkNextBuild() {
  console.log('\n🔍 Checking Next.js build...');
  
  const nextPath = join(process.cwd(), '.next');
  
  if (!existsSync(nextPath)) {
    addResult(
      'Next.js Build',
      'warning',
      '.next directory not found',
      'This is normal for first run. Will be created on dev server start.'
    );
  } else {
    addResult(
      'Next.js Build',
      'pass',
      '.next directory exists',
      undefined
    );
  }
}

function printResults() {
  console.log('\n\n╔══════════════════════════════════════════════════════╗');
  console.log('║         DIAGNOSTIC RESULTS                         ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  
  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;
  
  results.forEach((result) => {
    const icon =
      result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
    console.log('');
    
    if (result.status === 'pass') passCount++;
    if (result.status === 'fail') failCount++;
    if (result.status === 'warning') warningCount++;
  });
  
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total: ${results.length} checks`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (failCount > 0) {
    console.log('🔧 RECOMMENDED ACTIONS:');
    console.log('1. Run: quick-fix.bat (to fix Prisma and process issues)');
    console.log('2. Check .env.local file exists with all required variables');
    console.log('3. Ensure PostgreSQL and Redis are running');
    console.log('4. Run: npm install (if packages are missing)');
    console.log('5. Run: npx prisma generate && npx prisma db push\n');
  } else if (warningCount > 0) {
    console.log('⚠️  Some warnings detected. Application may run with limited functionality.\n');
  } else {
    console.log('✅ All checks passed! Your application should work correctly.\n');
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   HIRO - DIAGNOSTIC TOOL                           ║');
  console.log('║   Checking for Internal Server Error causes...     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  
  checkEnvironmentFile();
  checkEnvironmentVariables();
  checkNodeModules();
  checkNextBuild();
  checkPrismaClient();
  await checkDatabaseConnection();
  checkRedisConnection();
  checkRunningProcesses();
  
  printResults();
}

main().catch((error) => {
  console.error('Diagnostic failed:', error);
  process.exit(1);
});

