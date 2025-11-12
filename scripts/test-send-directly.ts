/**
 * Test Message Sending Directly
 * This tests the actual Facebook API call
 */

import { prisma } from '../src/lib/db';
import { FacebookClient } from '../src/lib/facebook/client';

async function testSendDirectly() {
  console.log('🔍 Testing Direct Message Send...\n');

  try {
    // Get a Facebook page with token
    const page = await prisma.facebookPage.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!page) {
      console.error('❌ No active Facebook page found!');
      return;
    }

    console.log(`✅ Found page: ${page.pageName}`);
    console.log(`   Page ID: ${page.pageId}`);
    console.log(`   Has token: ${!!page.pageAccessToken}`);
    console.log('');

    // Get a contact with PSID (from ANY page)
    const contact = await prisma.contact.findFirst({
      where: {
        messengerPSID: {
          not: null,
        },
        hasMessenger: true,
      },
      include: {
        facebookPage: true,
      },
    });

    if (!contact) {
      console.error('❌ No contact with Messenger PSID found!');
      return;
    }

    console.log(`✅ Found contact: ${contact.firstName} ${contact.lastName || ''}`);
    console.log(`   Contact ID: ${contact.id}`);
    console.log(`   PSID: ${contact.messengerPSID}`);
    console.log(`   Page: ${contact.facebookPage.pageName}`);
    console.log('');

    // Use the contact's page token, not the first page
    const contactPage = contact.facebookPage;
    console.log(`Using page: ${contactPage.pageName}`);
    console.log(`Has token: ${!!contactPage.pageAccessToken}`);
    console.log('');

    // Test the Facebook API call
    console.log('📤 Testing Facebook API call...\n');

    const client = new FacebookClient(contactPage.pageAccessToken);
    
    const testMessage = `Test message from campaign system - ${new Date().toLocaleTimeString()}`;
    
    console.log(`Sending to PSID: ${contact.messengerPSID}`);
    console.log(`Message: "${testMessage}"`);
    console.log('');

    const result = await client.sendMessengerMessage({
      recipientId: contact.messengerPSID!,
      message: testMessage,
    });

    if (result.success) {
      console.log('✅ ✅ ✅ MESSAGE SENT SUCCESSFULLY! ✅ ✅ ✅\n');
      console.log('Result:', result);
      console.log('');
      console.log('🎉 Facebook API is working!');
      console.log('   The issue is NOT with the Facebook API.');
      console.log('   The issue is with the campaign triggering logic.');
    } else {
      console.log('❌ MESSAGE FAILED TO SEND\n');
      console.log('Error:', result);
      console.log('');
      
      if ('error' in result && result.error) {
        const errorMsg = result.error.toLowerCase();
        
        if (errorMsg.includes('token') || errorMsg.includes('oauth')) {
          console.log('🔴 ISSUE: Facebook Access Token');
          console.log('   Your token is expired or invalid');
          console.log('   Fix: Reconnect Facebook page in Settings → Integrations');
        } else if (errorMsg.includes('permission')) {
          console.log('🔴 ISSUE: Permission Denied');
          console.log('   User must have messaged your page within 24 hours');
          console.log('   OR use a message tag for outside 24hr window');
        } else if (errorMsg.includes('rate')) {
          console.log('🔴 ISSUE: Rate Limit');
          console.log('   Too many messages sent too quickly');
          console.log('   Wait a few minutes and try again');
        } else {
          console.log('🔴 ISSUE: Unknown Facebook Error');
          console.log('   See error details above');
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('');
    console.error('Stack:', (error as Error).stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSendDirectly().catch(console.error);

