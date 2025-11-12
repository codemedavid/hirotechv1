import { prisma } from '../src/lib/db';

async function fixMissingTables() {
  console.log('\n🔧 Fixing Missing Database Tables\n');
  console.log('='.repeat(60));

  try {
    console.log('\n1️⃣  Adding SyncJob table...');
    
    // Create SyncJob table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SyncJob" (
        "id" TEXT NOT NULL,
        "facebookPageId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "totalContacts" INTEGER NOT NULL DEFAULT 0,
        "syncedContacts" INTEGER NOT NULL DEFAULT 0,
        "failedContacts" INTEGER NOT NULL DEFAULT 0,
        "errors" JSONB,
        "tokenExpired" BOOLEAN NOT NULL DEFAULT false,
        "startedAt" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
      );
    `);
    
    console.log('   ✅ SyncJob table created/verified');

    console.log('\n2️⃣  Creating indexes...');
    
    // Create indexes for SyncJob
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SyncJob_facebookPageId_status_idx" 
      ON "SyncJob"("facebookPageId", "status");
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SyncJob_status_createdAt_idx" 
      ON "SyncJob"("status", "createdAt");
    `);
    
    console.log('   ✅ Indexes created');

    console.log('\n3️⃣  Checking WebhookEvent table...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WebhookEvent" (
        "id" TEXT NOT NULL,
        "platform" TEXT NOT NULL,
        "eventType" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "processed" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
      );
    `);
    
    console.log('   ✅ WebhookEvent table created/verified');

    console.log('\n4️⃣  Creating WebhookEvent indexes...');
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "WebhookEvent_processed_createdAt_idx" 
      ON "WebhookEvent"("processed", "createdAt");
    `);
    
    console.log('   ✅ WebhookEvent indexes created');

    console.log('\n5️⃣  Verifying all tables...');
    
    const tables: Array<{ tablename: string }> = await prisma.$queryRawUnsafe(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    
    console.log(`\n   Found ${tables.length} tables:`);
    const tableList = tables.map(t => t.tablename);
    
    const requiredTables = [
      'User', 'Organization', 'Contact', 'Campaign', 
      'FacebookPage', 'Message', 'Conversation',
      'SyncJob', 'WebhookEvent', 'Tag', 'Template',
      'Pipeline', 'PipelineStage', 'ContactActivity'
    ];
    
    requiredTables.forEach(table => {
      const exists = tableList.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Database tables fixed!\n');

  } catch (error) {
    console.error('\n❌ Error fixing tables:', error);
    if (error instanceof Error) {
      console.error(error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingTables();

