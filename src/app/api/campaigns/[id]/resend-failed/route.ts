import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { FacebookClient } from '@/lib/facebook/client';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the campaign with failed messages
    const campaign = await prisma.campaign.findUnique({
      where: { 
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        facebookPage: true,
        messages: {
          where: {
            status: 'FAILED',
          },
          include: {
            contact: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const failedMessages = campaign.messages;

    if (failedMessages.length === 0) {
      return NextResponse.json(
        { error: 'No failed messages to resend' },
        { status: 400 }
      );
    }

    console.log(`🔄 Resending ${failedMessages.length} failed messages for campaign ${id}`);

    const client = new FacebookClient(campaign.facebookPage.pageAccessToken);
    let successCount = 0;
    let stillFailedCount = 0;

    // Process failed messages sequentially with rate limiting
    for (const message of failedMessages) {
      try {
        const recipientId = campaign.platform === 'MESSENGER' 
          ? message.contact.messengerPSID 
          : message.contact.instagramSID;

        if (!recipientId) {
          console.warn(`⚠️  No recipient ID for contact ${message.contact.id}`);
          stillFailedCount++;
          continue;
        }

        // Attempt to resend the message
        let result;
        if (campaign.platform === 'MESSENGER') {
          result = await client.sendMessengerMessage({
            recipientId,
            message: message.content,
            messageTag: campaign.messageTag || undefined,
          });
        } else {
          result = await client.sendInstagramMessage(recipientId, message.content);
        }

        if (result.success) {
          // Update message status to SENT
          await prisma.message.update({
            where: { id: message.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              failedAt: null,
              errorMessage: null,
              facebookMessageId: result.data?.message_id,
            },
          });

          // Update campaign counts
          await prisma.campaign.update({
            where: { id },
            data: {
              sentCount: { increment: 1 },
              failedCount: { decrement: 1 },
            },
          });

          successCount++;
          console.log(`✅ Resent message to ${message.contact.firstName}`);
        } else {
          stillFailedCount++;
          // Update error message
          await prisma.message.update({
            where: { id: message.id },
            data: {
              errorMessage: 'error' in result ? result.error : 'Failed to resend',
              failedAt: new Date(),
            },
          });
          console.error(`❌ Failed to resend to ${message.contact.firstName}:`, 'error' in result ? result.error : 'Unknown error');
        }

        // Rate limiting - wait 1 second between messages
        if (failedMessages.indexOf(message) < failedMessages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        stillFailedCount++;
        console.error(`❌ Error resending message ${message.id}:`, error);
      }
    }

    console.log(`📊 Resend complete: ${successCount} succeeded, ${stillFailedCount} still failed`);

    return NextResponse.json({
      success: true,
      successCount,
      stillFailedCount,
      totalAttempted: failedMessages.length,
      message: `Resent ${successCount} messages successfully. ${stillFailedCount} messages still failed.`,
    });
  } catch (error) {
    const err = error as Error;
    console.error('❌ Resend failed messages error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to resend messages' },
      { status: 500 }
    );
  }
}

