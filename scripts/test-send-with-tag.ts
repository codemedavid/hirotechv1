/**
 * Test sending with a message tag
 */

import { prisma } from '../src/lib/db';
import { FacebookClient } from '../src/lib/facebook/client';

async function testSendWithTag() {
  console.log('🔍 Testing Message Send WITH Message Tag...\n');

  try {
    const contact = await prisma.contact.findFirst({
      where: {
        messengerPSID: { not: null },
        hasMessenger: true,
      },
      include: {
        facebookPage: true,
      },
    });

    if (!contact) {
      console.error('❌ No contact found');
      return;
    }

    console.log(`✅ Contact: ${contact.firstName}`);
    console.log(`   PSID: ${contact.messengerPSID}`);
    console.log(`   Page: ${contact.facebookPage.pageName}`);
    console.log('');

    const client = new FacebookClient(contact.facebookPage.pageAccessToken);
    
    const testMessage = `[ACCOUNT UPDATE] Test with message tag - ${new Date().toLocaleTimeString()}`;
    
    console.log('📤 Sending WITH message tag: ACCOUNT_UPDATE\n');
    console.log(`Message: "${testMessage}"`);
    console.log('');

    const result = await client.sendMessengerMessage({
      recipientId: contact.messengerPSID!,
      message: testMessage,
      messageTag: 'ACCOUNT_UPDATE',
    });

    if (result.success) {
      console.log('✅ ✅ ✅ MESSAGE SENT WITH TAG! ✅ ✅ ✅\n');
      console.log('Result:', result);
      console.log('');
      console.log('🎉 Message tags WORK!');
      console.log('');
      console.log('SOLUTION: Use message tags in your campaigns:');
      console.log('- ACCOUNT_UPDATE');
      console.log('- POST_PURCHASE_UPDATE');
      console.log('- CONFIRMED_EVENT_UPDATE');
      console.log('- HUMAN_AGENT');
    } else {
      console.log('❌ MESSAGE STILL FAILED\n');
      console.log('Error:', result);
      console.log('');
      console.log('This might mean:');
      console.log('1. Contact never interacted with page');
      console.log('2. Page doesn\'t have proper permissions');
      console.log('3. Token expired');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSendWithTag().catch(console.error);

