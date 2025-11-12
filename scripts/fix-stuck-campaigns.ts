import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Utility script to fix campaigns stuck in SENDING status
 * Run with: npx tsx scripts/fix-stuck-campaigns.ts
 */
async function fixStuckCampaigns() {
  console.log('🔍 Searching for stuck campaigns...\n');

  // Find campaigns in SENDING status where all messages have been processed
  const stuckCampaigns = await prisma.campaign.findMany({
    where: {
      status: 'SENDING',
    },
    select: {
      id: true,
      name: true,
      status: true,
      totalRecipients: true,
      sentCount: true,
      failedCount: true,
      deliveredCount: true,
      startedAt: true,
      createdAt: true,
    },
  });

  if (stuckCampaigns.length === 0) {
    console.log('✅ No stuck campaigns found. All campaigns are in correct states.');
    return;
  }

  console.log(`Found ${stuckCampaigns.length} campaign(s) in SENDING status:\n`);

  const toFix: typeof stuckCampaigns = [];

  stuckCampaigns.forEach((campaign) => {
    const processed = campaign.sentCount + campaign.failedCount;
    const isFullyProcessed = processed >= campaign.totalRecipients;
    const timeInSending = campaign.startedAt 
      ? Math.round((Date.now() - campaign.startedAt.getTime()) / 1000 / 60)
      : 0;

    console.log(`📊 Campaign: ${campaign.name} (${campaign.id})`);
    console.log(`   Total Recipients: ${campaign.totalRecipients}`);
    console.log(`   Sent: ${campaign.sentCount}`);
    console.log(`   Failed: ${campaign.failedCount}`);
    console.log(`   Processed: ${processed}/${campaign.totalRecipients} (${Math.round(processed/campaign.totalRecipients*100)}%)`);
    console.log(`   Time in SENDING: ${timeInSending} minutes`);
    console.log(`   Status: ${isFullyProcessed ? '⚠️ STUCK (fully processed)' : '⏳ Still processing'}`);
    console.log('');

    if (isFullyProcessed) {
      toFix.push(campaign);
    }
  });

  if (toFix.length === 0) {
    console.log('✅ All SENDING campaigns are actively processing. No fixes needed.');
    return;
  }

  console.log(`\n🔧 Found ${toFix.length} stuck campaign(s) to fix:\n`);

  for (const campaign of toFix) {
    try {
      const updated = await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      console.log(`✅ Fixed: ${campaign.name} (${campaign.id})`);
      console.log(`   Status: SENDING → COMPLETED`);
      console.log(`   Completed at: ${updated.completedAt}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Failed to fix ${campaign.name} (${campaign.id}):`, error);
    }
  }

  console.log(`\n🎉 Fixed ${toFix.length} stuck campaign(s)!`);
}

// Run the script
fixStuckCampaigns()
  .catch((error) => {
    console.error('❌ Script error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
