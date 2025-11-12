/**
 * Comprehensive Campaign System Test
 * Tests everything from database to API to Facebook
 */

import { prisma } from '../src/lib/db';

async function comprehensiveTest() {
  console.log('🔍 COMPREHENSIVE CAMPAIGN SYSTEM TEST\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let allPassed = true;

  // TEST 1: Database Connection
  console.log('TEST 1: Database Connection');
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('');
    allPassed = false;
  }

  // TEST 2: Facebook Pages
  console.log('TEST 2: Facebook Pages');
  try {
    const pages = await prisma.facebookPage.findMany({
      where: { isActive: true },
    });
    
    if (pages.length === 0) {
      console.error('❌ No active Facebook pages found!');
      console.error('   Fix: Connect a Facebook page in Settings → Integrations');
      console.error('');
      allPassed = false;
    } else {
      console.log(`✅ Found ${pages.length} active page(s):`);
      pages.forEach((page, i) => {
        console.log(`   ${i + 1}. ${page.pageName}`);
        console.log(`      Page ID: ${page.pageId}`);
        console.log(`      Has Token: ${!!page.pageAccessToken}`);
        console.log(`      Token Length: ${page.pageAccessToken?.length || 0} chars`);
      });
      console.log('');
    }
  } catch (error) {
    console.error('❌ Failed to fetch Facebook pages:', error);
    console.error('');
    allPassed = false;
  }

  // TEST 3: Contacts with PSIDs
  console.log('TEST 3: Contacts with Valid PSIDs');
  try {
    const totalContacts = await prisma.contact.count();
    const messengerContacts = await prisma.contact.count({
      where: {
        hasMessenger: true,
        messengerPSID: { not: null },
      },
    });
    const instagramContacts = await prisma.contact.count({
      where: {
        hasInstagram: true,
        instagramSID: { not: null },
      },
    });

    console.log(`   Total contacts: ${totalContacts}`);
    console.log(`   With Messenger PSID: ${messengerContacts}`);
    console.log(`   With Instagram SID: ${instagramContacts}`);

    if (messengerContacts === 0 && instagramContacts === 0) {
      console.error('❌ No contacts with valid PSIDs!');
      console.error('   Fix: Sync contacts from Facebook');
      console.error('');
      allPassed = false;
    } else {
      console.log('✅ Contacts have valid PSIDs\n');
    }
  } catch (error) {
    console.error('❌ Failed to check contacts:', error);
    console.error('');
    allPassed = false;
  }

  // TEST 4: Recent Campaigns
  console.log('TEST 4: Recent Campaigns');
  try {
    const campaigns = await prisma.campaign.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    if (campaigns.length === 0) {
      console.log('   No campaigns found (this is OK if you haven\'t created any)');
      console.log('');
    } else {
      campaigns.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name}`);
        console.log(`      Status: ${c.status}`);
        console.log(`      Recipients: ${c.totalRecipients}`);
        console.log(`      Sent: ${c.sentCount} | Failed: ${c.failedCount}`);
        console.log(`      Messages: ${c._count.messages}`);
        
        if (c.status === 'SENDING' && c._count.messages === 0) {
          console.log('      ⚠️  STUCK: No messages created');
        } else if (c.status === 'SENDING') {
          console.log(`      ⚠️  STUCK: Still in SENDING status`);
        }
        console.log('');
      });

      const stuck = campaigns.filter(c => c.status === 'SENDING');
      if (stuck.length > 0) {
        console.error(`❌ Found ${stuck.length} stuck campaign(s)`);
        console.error('   Fix: Run npx tsx scripts/fix-stuck-campaigns.ts');
        console.error('');
        allPassed = false;
      } else {
        console.log('✅ No stuck campaigns\n');
      }
    }
  } catch (error) {
    console.error('❌ Failed to check campaigns:', error);
    console.error('');
    allPassed = false;
  }

  // TEST 5: Message Records
  console.log('TEST 5: Message Records');
  try {
    const messageStats = await prisma.message.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    if (messageStats.length === 0) {
      console.log('   No messages sent yet (this is OK if testing)');
      console.log('');
    } else {
      messageStats.forEach((stat) => {
        console.log(`   ${stat.status}: ${stat._count.status}`);
      });
      console.log('✅ Messages exist in database\n');
    }
  } catch (error) {
    console.error('❌ Failed to check messages:', error);
    console.error('');
    allPassed = false;
  }

  // TEST 6: Environment Variables
  console.log('TEST 6: Environment Variables');
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  let envPassed = true;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing: ${envVar}`);
      envPassed = false;
      allPassed = false;
    }
  }

  if (envPassed) {
    console.log('✅ All required environment variables present\n');
  } else {
    console.error('   Fix: Check your .env file');
    console.error('');
  }

  // SUMMARY
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY\n');

  if (allPassed) {
    console.log('✅ ✅ ✅ ALL TESTS PASSED ✅ ✅ ✅\n');
    console.log('Your system is properly configured.');
    console.log('');
    console.log('Next step: Test actual message sending');
    console.log('Run: npx tsx scripts/test-send-directly.ts');
  } else {
    console.log('❌ SOME TESTS FAILED\n');
    console.log('Please fix the issues above before proceeding.');
  }

  await prisma.$disconnect();
}

comprehensiveTest().catch(console.error);

