#!/usr/bin/env tsx

/**
 * Reset Specific Campaign
 * 
 * Usage: tsx scripts/reset-campaign.ts [campaignId]
 * Or reset ALL stuck campaigns: tsx scripts/reset-campaign.ts --all
 */

import { prisma } from '../src/lib/db';

async function resetCampaign() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Reset all campaigns in SENDING status
    console.log('🔄 Resetting ALL campaigns in SENDING status...\n');
    
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'SENDING',
      },
    });
    
    if (campaigns.length === 0) {
      console.log('✅ No campaigns to reset');
      return;
    }
    
    console.log(`Found ${campaigns.length} campaign(s) to reset:\n`);
    
    for (const campaign of campaigns) {
      console.log(`📝 ${campaign.name}`);
      console.log(`   ID: ${campaign.id}`);
      console.log(`   Progress: ${campaign.sentCount}/${campaign.totalRecipients}`);
      console.log(`   Failed: ${campaign.failedCount}`);
      
      if (campaign.sentCount >= campaign.totalRecipients) {
        console.log('   → Marking as COMPLETED\n');
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      } else if (campaign.sentCount === 0 && campaign.failedCount === 0) {
        console.log('   → Resetting to DRAFT (no progress)\n');
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: 'DRAFT',
            startedAt: null,
            totalRecipients: 0,
          },
        });
      } else {
        console.log('   → Marking as COMPLETED (partial progress)\n');
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      }
    }
    
    console.log('✅ All campaigns reset successfully!');
    
  } else {
    // Reset specific campaign by ID
    const campaignId = args[0];
    
    console.log(`🔄 Resetting campaign: ${campaignId}\n`);
    
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    
    if (!campaign) {
      console.log('❌ Campaign not found');
      return;
    }
    
    console.log(`📝 Campaign: ${campaign.name}`);
    console.log(`   Status: ${campaign.status}`);
    console.log(`   Progress: ${campaign.sentCount}/${campaign.totalRecipients}`);
    
    if (campaign.status === 'SENDING') {
      if (campaign.sentCount >= campaign.totalRecipients) {
        console.log('\n   → Marking as COMPLETED');
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      } else if (campaign.sentCount === 0 && campaign.failedCount === 0) {
        console.log('\n   → Resetting to DRAFT (no progress)');
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: 'DRAFT',
            startedAt: null,
            totalRecipients: 0,
          },
        });
      } else {
        console.log('\n   → Marking as COMPLETED (partial progress)');
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      }
      
      console.log('✅ Campaign reset successfully!');
    } else {
      console.log(`\n   Campaign is in ${campaign.status} status (not SENDING)`);
      console.log('   No action needed');
    }
  }
}

resetCampaign()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

