/**
 * Diagnostic Script: Check Contacts for Valid PSIDs
 * 
 * This script checks how many contacts have valid Messenger PSIDs or Instagram SIDs
 * Run with: npx tsx scripts/check-contacts-psids.ts
 */

import { prisma } from '../src/lib/db';

async function checkContactsPSIDs() {
  console.log('🔍 Checking contacts for valid PSIDs...\n');

  try {
    // Get all contacts
    const allContacts = await prisma.contact.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        hasMessenger: true,
        hasInstagram: true,
        messengerPSID: true,
        instagramSID: true,
        facebookPage: {
          select: {
            pageName: true,
          },
        },
      },
    });

    console.log(`📊 Total contacts: ${allContacts.length}\n`);

    // Analyze contacts
    let messengerFlagWithPSID = 0;
    let messengerFlagWithoutPSID = 0;
    let instagramFlagWithSID = 0;
    let instagramFlagWithoutSID = 0;
    let noFlags = 0;
    let validForMessenger = 0;
    let validForInstagram = 0;

    const problematicContacts: Array<{
      id: string;
      firstName: string | null;
      lastName: string | null;
      issue: string;
      facebookPage?: { pageName: string };
      hasMessenger?: boolean;
      messengerPSID?: string | null;
      hasInstagram?: boolean;
      instagramSID?: string | null;
    }> = [];

    allContacts.forEach((contact) => {
      // Check Messenger
      if (contact.hasMessenger) {
        if (contact.messengerPSID) {
          messengerFlagWithPSID++;
          validForMessenger++;
        } else {
          messengerFlagWithoutPSID++;
          problematicContacts.push({
            ...contact,
            issue: 'Has Messenger flag but NO PSID',
          });
        }
      }

      // Check Instagram
      if (contact.hasInstagram) {
        if (contact.instagramSID) {
          instagramFlagWithSID++;
          validForInstagram++;
        } else {
          instagramFlagWithoutSID++;
          problematicContacts.push({
            ...contact,
            issue: 'Has Instagram flag but NO SID',
          });
        }
      }

      // No flags at all
      if (!contact.hasMessenger && !contact.hasInstagram) {
        noFlags++;
      }
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 MESSENGER ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Valid (has flag + PSID):      ${messengerFlagWithPSID}`);
    console.log(`❌ Invalid (has flag but NO PSID): ${messengerFlagWithoutPSID}`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📷 INSTAGRAM ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Valid (has flag + SID):       ${instagramFlagWithSID}`);
    console.log(`❌ Invalid (has flag but NO SID): ${instagramFlagWithoutSID}`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 CAMPAIGN TARGETING SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📨 Can receive Messenger campaigns: ${validForMessenger}`);
    console.log(`📷 Can receive Instagram campaigns: ${validForInstagram}`);
    console.log(`⚠️  No platform flags:              ${noFlags}`);
    console.log('');

    if (problematicContacts.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`⚠️  PROBLEMATIC CONTACTS (${problematicContacts.length})`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('These contacts have platform flags but NO recipient IDs:');
      console.log('');

      problematicContacts.slice(0, 10).forEach((contact, i) => {
        console.log(`${i + 1}. ${contact.firstName} ${contact.lastName || ''}`);
        console.log(`   Page: ${contact.facebookPage?.pageName || 'Unknown'}`);
        console.log(`   Issue: ${contact.issue}`);
        console.log(`   Messenger: ${contact.hasMessenger ? '✓' : '✗'} (PSID: ${contact.messengerPSID || 'NULL'})`);
        console.log(`   Instagram: ${contact.hasInstagram ? '✓' : '✗'} (SID: ${contact.instagramSID || 'NULL'})`);
        console.log('');
      });

      if (problematicContacts.length > 10) {
        console.log(`... and ${problematicContacts.length - 10} more`);
        console.log('');
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMMENDATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (messengerFlagWithoutPSID > 0 || instagramFlagWithoutSID > 0) {
      console.log('⚠️  You have contacts with platform flags but no PSIDs!');
      console.log('');
      console.log('Why this happens:');
      console.log('• Contacts synced from Facebook but without active conversations');
      console.log('• Facebook API limitations prevent PSID fetching');
      console.log('• Manually created contacts without proper validation');
      console.log('');
      console.log('Solutions:');
      console.log('1. Re-sync contacts: Settings → Integrations → Sync Contacts');
      console.log('2. Wait for users to message your page (PSIDs populated via webhooks)');
      console.log('3. Remove invalid contacts or fix their PSID fields');
      console.log('');
    } else {
      console.log('✅ All contacts with platform flags have valid PSIDs!');
      console.log('');
    }

    if (validForMessenger === 0 && validForInstagram === 0) {
      console.log('🚨 CRITICAL: No contacts can receive campaigns!');
      console.log('   You need to sync contacts from Facebook first.');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error checking contacts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkContactsPSIDs().catch(console.error);

