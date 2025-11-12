#!/usr/bin/env tsx

import { prisma } from '../src/lib/db';

async function forceReset() {
  console.log('🔧 Force resetting all SENDING campaigns...\n');
  
  const result = await prisma.campaign.updateMany({
    where: {
      status: 'SENDING',
    },
    data: {
      status: 'DRAFT',
      startedAt: null,
    },
  });
  
  console.log(`✅ Updated ${result.count} campaign(s)\n`);
  
  // Verify
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: 'SENDING',
    },
  });
  
  if (campaigns.length === 0) {
    console.log('✅ No more SENDING campaigns found');
  } else {
    console.log(`⚠️  Still found ${campaigns.length} SENDING campaigns`);
  }
}

forceReset()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

