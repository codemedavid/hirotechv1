import { prisma } from '../src/lib/db';

async function syncSchema() {
  console.log('\n🔧 Syncing Database Schema\n');
  console.log('='.repeat(50));

  try {
    console.log('\n1️⃣  Adding missing image column...');
    
    // Add image column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
    `);
    
    console.log('   ✅ Image column added/verified');

    console.log('\n2️⃣  Verifying User table structure...');
    const columns: Array<{ column_name: string; data_type: string; is_nullable: string }> = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      ORDER BY ordinal_position;
    `);

    console.log('\n   Current User table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Schema sync complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncSchema();

