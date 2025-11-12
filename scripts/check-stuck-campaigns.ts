/**
 * Check for campaigns stuck in SENDING status
 * Run with: npx tsx scripts/check-stuck-campaigns.ts
 */

import { prisma } from '../src/lib/db';

async function checkStuckCampaigns() {
  console.log('🔍 Checking for stuck campaigns...\n');

  try {
    // Get campaigns in SENDING status
    const sendingCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'SENDING',
      },
      include: {
        facebookPage: {
          select: {
            pageName: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    console.log(`📊 Found ${sendingCampaigns.length} campaigns in SENDING status\n`);

    if (sendingCampaigns.length === 0) {
      console.log('✅ No stuck campaigns found!\n');
      
      // Show recent completed campaigns
      const recentCampaigns = await prisma.campaign.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          facebookPage: {
            select: {
              pageName: true,
            },
          },
        },
      });

      console.log('📋 Recent campaigns:');
      recentCampaigns.forEach((c, i) => {
        console.log(`${i + 1}. ${c.name}`);
        console.log(`   Status: ${c.status}`);
        console.log(`   Recipients: ${c.totalRecipients}`);
        console.log(`   Sent: ${c.sentCount} | Failed: ${c.failedCount}`);
        console.log(`   Created: ${c.createdAt}`);
        console.log('');
      });
    } else {
      console.log('⚠️  STUCK CAMPAIGNS FOUND:\n');
      
      for (const campaign of sendingCampaigns) {
        const timeSinceStart = campaign.startedAt 
          ? Math.floor((Date.now() - campaign.startedAt.getTime()) / 1000 / 60)
          : 0;

        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Campaign: ${campaign.name}`);
        console.log(`ID: ${campaign.id}`);
        console.log(`Page: ${campaign.facebookPage.pageName}`);
        console.log(`Platform: ${campaign.platform}`);
        console.log(`Status: ${campaign.status} (for ${timeSinceStart} minutes)`);
        console.log(`Total Recipients: ${campaign.totalRecipients}`);
        console.log(`Sent: ${campaign.sentCount}`);
        console.log(`Failed: ${campaign.failedCount}`);
        console.log(`Delivered: ${campaign.deliveredCount}`);
        console.log(`Message Records: ${campaign._count.messages}`);
        console.log(`Started: ${campaign.startedAt}`);
        console.log('');

        // Analyze the issue
        if (campaign.totalRecipients === 0) {
          console.log('🔴 Issue: No target recipients found');
          console.log('   This campaign should have been marked COMPLETED');
        } else if (campaign._count.messages === 0) {
          console.log('🔴 Issue: No message records created');
          console.log('   Messages were never queued or sent');
        } else if (campaign.sentCount + campaign.failedCount >= campaign.totalRecipients) {
          console.log('🟡 Issue: All messages processed but status not updated');
          console.log('   Campaign should be marked COMPLETED');
        } else {
          console.log('🟡 Issue: Messages still being processed');
          const remaining = campaign.totalRecipients - (campaign.sentCount + campaign.failedCount);
          console.log(`   ${remaining} messages remaining`);
        }
        console.log('');
      }

      // Offer to fix
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💡 FIXES AVAILABLE:\n');
      console.log('To fix campaigns that should be completed:');
      console.log('```sql');
      console.log(`UPDATE "Campaign"`);
      console.log(`SET status = 'COMPLETED', "completedAt" = NOW()`);
      console.log(`WHERE status = 'SENDING'`);
      console.log(`  AND ("sentCount" + "failedCount") >= "totalRecipients";`);
      console.log('```\n');
      
      console.log('To fix campaigns with no recipients:');
      console.log('```sql');
      console.log(`UPDATE "Campaign"`);
      console.log(`SET status = 'COMPLETED', "completedAt" = NOW()`);
      console.log(`WHERE status = 'SENDING' AND "totalRecipients" = 0;`);
      console.log('```\n');
    }

    // Check message statistics
    const messageStats = await prisma.message.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 MESSAGE STATISTICS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    messageStats.forEach((stat) => {
      console.log(`${stat.status}: ${stat._count.status}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStuckCampaigns().catch(console.error);

