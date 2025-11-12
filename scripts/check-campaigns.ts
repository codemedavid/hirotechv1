#!/usr/bin/env tsx

import { prisma } from '../src/lib/db';

async function checkCampaigns() {
  console.log('📊 Checking all campaigns...\n');
  
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  
  console.log(`Found ${campaigns.length} campaigns:\n`);
  
  for (const campaign of campaigns) {
    console.log(`📝 ${campaign.name}`);
    console.log(`   ID: ${campaign.id}`);
    console.log(`   Status: ${campaign.status}`);
    console.log(`   Progress: ${campaign.sentCount}/${campaign.totalRecipients}`);
    console.log(`   Failed: ${campaign.failedCount}`);
    console.log(`   Created: ${campaign.createdAt}`);
    if (campaign.startedAt) {
      console.log(`   Started: ${campaign.startedAt}`);
    }
    console.log('');
  }
  
  // Count by status
  const byStatus = await prisma.campaign.groupBy({
    by: ['status'],
    _count: true,
  });
  
  console.log('By status:');
  for (const stat of byStatus) {
    console.log(`   ${stat.status}: ${stat._count}`);
  }
}

checkCampaigns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

