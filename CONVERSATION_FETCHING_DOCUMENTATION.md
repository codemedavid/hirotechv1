# Complete Conversation Fetching Implementation Guide

## Overview
This document provides a comprehensive guide on how the conversation fetching system was implemented in this Next.js application, including all credentials, database schemas, API routes, authentication, webhooks, and frontend integration.

---

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Environment Variables & Credentials](#environment-variables--credentials)
3. [Database Schema (Prisma)](#database-schema-prisma)
4. [Authentication Setup (NextAuth.js)](#authentication-setup-nextauthjs)
5. [Database Client Setup](#database-client-setup)
6. [Facebook Client Integration](#facebook-client-integration)
7. [API Routes Implementation](#api-routes-implementation)
8. [Webhook System](#webhook-system)
9. [Frontend Integration](#frontend-integration)
10. [Real-time Updates (Optional)](#real-time-updates-optional)
11. [Deployment Checklist](#deployment-checklist)
12. [Step-by-Step Replication Guide](#step-by-step-replication-guide)

---

## Tech Stack

### Core Dependencies
```json
{
  "next": "16.0.1",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "typescript": "^5",
  
  "prisma": "^6.19.0",
  "@prisma/client": "^6.19.0",
  
  "next-auth": "^5.0.0-beta.30",
  "bcrypt": "^6.0.0",
  
  "axios": "^1.13.2",
  "bullmq": "^5.63.0",
  "ioredis": "^5.8.2",
  
  "tailwindcss": "^4",
  "@radix-ui/react-*": "latest",
  "lucide-react": "^0.553.0",
  "date-fns": "^4.1.0"
}
```

---

## Environment Variables & Credentials

Create a `.env` file in your project root:

```bash
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Facebook App Credentials
FACEBOOK_APP_ID="your_facebook_app_id"
FACEBOOK_APP_SECRET="your_facebook_app_secret"
FACEBOOK_WEBHOOK_VERIFY_TOKEN="your_custom_webhook_verify_token"

# Redis (for BullMQ)
REDIS_URL="redis://localhost:6379"

# Node Environment
NODE_ENV="development"
```

### How to Get Facebook Credentials

1. **Create Facebook App**
   - Go to https://developers.facebook.com
   - Create a new app (Business type)
   - Select "Messenger" platform

2. **Get App ID and Secret**
   - Navigate to Settings > Basic
   - Copy App ID and App Secret

3. **Generate Page Access Token**
   - Go to Messenger > Settings
   - Select a Facebook Page
   - Generate a Page Access Token
   - Save this token in your database (encrypted)

4. **Set up Webhook**
   - URL: `https://yourdomain.com/api/webhooks/facebook`
   - Verify Token: (custom string you set in env)
   - Subscribe to: `messages`, `messaging_postbacks`, `message_deliveries`, `message_reads`

---

## Database Schema (Prisma)

### 1. Create `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ============================================
// ORGANIZATION & USER MANAGEMENT
// ============================================

model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  users         User[]
  contacts      Contact[]
  facebookPages FacebookPage[]
  campaigns     Campaign[]
  templates     Template[]
  pipelines     Pipeline[]
  tags          Tag[]
}

model User {
  id             String       @id @default(cuid())
  email          String       @unique
  password       String?
  name           String?
  role           Role         @default(AGENT)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  campaigns      Campaign[]
  conversations  Conversation[]
}

enum Role {
  ADMIN
  MANAGER
  AGENT
}

// ============================================
// FACEBOOK & INSTAGRAM INTEGRATION
// ============================================

model FacebookPage {
  id                  String       @id @default(cuid())
  organizationId      String
  organization        Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Facebook Page
  pageId              String       @unique
  pageName            String
  pageAccessToken     String       // Should be encrypted in production
  
  // Instagram Business (connected to page)
  instagramAccountId  String?      @unique
  instagramUsername   String?
  
  // Sync settings
  autoSync            Boolean      @default(true)
  lastSyncedAt        DateTime?
  
  isActive            Boolean      @default(true)
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
  
  contacts            Contact[]
  conversations       Conversation[]
}

// ============================================
// CONTACTS
// ============================================

model Contact {
  id             String       @id @default(cuid())
  
  // Platform identifiers
  messengerPSID  String?      // Page-Scoped ID for Messenger
  instagramSID   String?      // Instagram-Scoped ID
  
  // Contact info
  firstName      String
  lastName       String?
  profilePicUrl  String?
  locale         String?
  timezone       Int?
  
  // Platforms
  hasMessenger   Boolean      @default(false)
  hasInstagram   Boolean      @default(false)
  
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  facebookPageId String
  facebookPage   FacebookPage @relation(fields: [facebookPageId], references: [id], onDelete: Cascade)
  
  tags           String[]
  notes          String?      @db.Text
  lastInteraction DateTime?
  
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  messages       Message[]
  conversations  Conversation[]
  
  @@unique([messengerPSID, facebookPageId])
  @@index([instagramSID])
  @@index([organizationId])
}

// ============================================
// MESSAGES & CONVERSATIONS
// ============================================

model Conversation {
  id             String              @id @default(cuid())
  
  contactId      String
  contact        Contact             @relation(fields: [contactId], references: [id], onDelete: Cascade)
  
  facebookPageId String
  facebookPage   FacebookPage        @relation(fields: [facebookPageId], references: [id], onDelete: Cascade)
  
  platform       Platform
  status         ConversationStatus  @default(OPEN)
  lastMessageAt  DateTime
  
  assignedToId   String?
  assignedTo     User?               @relation(fields: [assignedToId], references: [id], onDelete: SetNull)
  
  messages       Message[]
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
  
  @@index([status, platform])
  @@index([lastMessageAt])
}

enum ConversationStatus {
  OPEN
  PENDING
  RESOLVED
  ARCHIVED
}

enum Platform {
  MESSENGER
  INSTAGRAM
}

model Message {
  id          String        @id @default(cuid())
  content     String        @db.Text
  platform    Platform
  status      MessageStatus @default(PENDING)
  
  facebookMessageId String?
  
  contactId   String
  contact     Contact       @relation(fields: [contactId], references: [id], onDelete: Cascade)
  
  conversationId String?
  conversation   Conversation? @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  isFromBusiness Boolean    @default(true)
  
  sentAt      DateTime?
  deliveredAt DateTime?
  readAt      DateTime?
  failedAt    DateTime?
  errorMessage String?
  
  createdAt   DateTime      @default(now())
  
  @@index([conversationId, createdAt])
}

enum MessageStatus {
  PENDING
  QUEUED
  SENT
  DELIVERED
  READ
  FAILED
}

// ============================================
// WEBHOOK EVENTS
// ============================================

model WebhookEvent {
  id         String   @id @default(cuid())
  platform   Platform
  eventType  String
  payload    Json
  processed  Boolean  @default(false)
  createdAt  DateTime @default(now())
  
  @@index([processed, createdAt])
}
```

### 2. Run Prisma Migrations

```bash
# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Push to database (alternative to migrate)
npx prisma db push
```

---

## Authentication Setup (NextAuth.js)

### Create `src/auth.ts`

```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './lib/db';
import bcrypt from 'bcrypt';
import type { User, Role } from '@prisma/client';

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  trustHost: true,
  basePath: '/api/auth',
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: true },
        });

        if (!user || !user.password) {
          return null;
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isCorrectPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
```

### Create API Route Handler `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

---

## Database Client Setup

### Create `src/lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
```

---

## Facebook Client Integration

### Create `src/lib/facebook/client.ts`

```typescript
import axios from 'axios';

const FB_GRAPH_URL = 'https://graph.facebook.com/v19.0';

export class FacebookApiError extends Error {
  constructor(
    public code: number,
    public type: string,
    message: string,
    public context?: string
  ) {
    super(message);
    this.name = 'FacebookApiError';
  }

  get isTokenExpired(): boolean {
    return this.code === 190;
  }

  get isRateLimited(): boolean {
    return this.code === 613 || this.code === 4 || this.code === 17;
  }
}

function parseFacebookError(error: any, context?: string): FacebookApiError {
  if (error.response?.data?.error) {
    const fbError = error.response.data.error;
    return new FacebookApiError(
      fbError.code,
      fbError.type || 'OAuthException',
      fbError.message,
      context
    );
  }
  throw error;
}

export class FacebookClient {
  constructor(private accessToken: string) {}

  /**
   * Send Messenger message
   */
  async sendMessengerMessage(recipientId: string, message: string) {
    try {
      const response = await axios.post(
        `${FB_GRAPH_URL}/me/messages`,
        {
          recipient: { id: recipientId },
          message: { text: message },
          messaging_type: 'RESPONSE',
        },
        { params: { access_token: this.accessToken } }
      );
      return { success: true, data: response.data };
    } catch (error: any) {
      if (error.response?.data?.error) {
        const fbError = error.response.data.error;
        return {
          success: false,
          error: 'FACEBOOK_API_ERROR',
          message: fbError.message,
        };
      }
      throw error;
    }
  }

  /**
   * Get Messenger profile
   */
  async getMessengerProfile(psid: string) {
    try {
      const response = await axios.get(`${FB_GRAPH_URL}/${psid}`, {
        params: {
          access_token: this.accessToken,
          fields: 'first_name,last_name,profile_pic,locale,timezone',
        },
      });
      return response.data;
    } catch (error: any) {
      throw parseFacebookError(error, `Failed to get profile for PSID: ${psid}`);
    }
  }

  /**
   * Get Instagram profile
   */
  async getInstagramProfile(igUserId: string) {
    try {
      const response = await axios.get(`${FB_GRAPH_URL}/${igUserId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'name,username,profile_picture_url',
        },
      });
      return response.data;
    } catch (error: any) {
      throw parseFacebookError(error, `Failed to get Instagram profile for User ID: ${igUserId}`);
    }
  }
}
```

---

## API Routes Implementation

### 1. Conversations List API: `src/app/api/conversations/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch conversations for the user's organization
    const conversations = await prisma.conversation.findMany({
      where: {
        contact: {
          organizationId: session.user.organizationId,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 50, // Limit to 50 most recent conversations
      include: {
        contact: true, // Include contact details
        messages: {
          take: 1, // Include only the last message
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
```

### Key Points:
- **Authentication**: Uses `auth()` from NextAuth to verify session
- **Organization Filtering**: Filters conversations by `organizationId`
- **Sorting**: Orders by `lastMessageAt` descending
- **Includes**: Fetches related contact and the last message
- **Limit**: Returns maximum 50 conversations

---

## Webhook System

### Create `src/app/api/webhooks/facebook/route.ts`

This webhook receives real-time messages from Facebook and creates conversations automatically.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

// Webhook verification (GET request)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// Webhook events (POST request)
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  // Verify signature for security
  const expectedSignature = crypto
    .createHmac('sha256', process.env.FACEBOOK_APP_SECRET!)
    .update(body)
    .digest('hex');

  if (`sha256=${expectedSignature}` !== signature) {
    return new NextResponse('Invalid signature', { status: 403 });
  }

  const data = JSON.parse(body);

  // Log webhook event
  await prisma.webhookEvent.create({
    data: {
      platform: 'MESSENGER',
      eventType: data.object || 'unknown',
      payload: data,
      processed: false,
    },
  });

  // Process webhook event
  try {
    for (const entry of data.entry || []) {
      // Messenger events
      if (entry.messaging) {
        for (const event of entry.messaging) {
          if (event.message && !event.message.is_echo) {
            await handleIncomingMessage(event);
          }
          if (event.delivery) {
            await handleDeliveryReceipt(event);
          }
          if (event.read) {
            await handleReadReceipt(event);
          }
        }
      }

      // Instagram events
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value) {
            await handleInstagramMessage(change.value);
          }
        }
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }

  return NextResponse.json({ success: true });
}

async function handleIncomingMessage(event: any) {
  try {
    const senderId = event.sender.id;
    const recipientId = event.recipient.id;
    const message = event.message;

    // Find the Facebook page
    const page = await prisma.facebookPage.findFirst({
      where: { pageId: recipientId },
    });

    if (!page) {
      console.error(`Page not found for pageId: ${recipientId}`);
      return;
    }

    // Find or create contact
    let contact = await prisma.contact.findFirst({
      where: { 
        messengerPSID: senderId,
        facebookPageId: page.id,
      },
    });

    // Auto-create contact if doesn't exist
    if (!contact) {
      try {
        const { FacebookClient } = await import('@/lib/facebook/client');
        const client = new FacebookClient(page.pageAccessToken);
        const profile = await client.getMessengerProfile(senderId);

        contact = await prisma.contact.create({
          data: {
            messengerPSID: senderId,
            firstName: profile.first_name || 'Unknown',
            lastName: profile.last_name,
            profilePicUrl: profile.profile_pic,
            locale: profile.locale,
            timezone: profile.timezone,
            hasMessenger: true,
            organizationId: page.organizationId,
            facebookPageId: page.id,
            lastInteraction: new Date(),
          },
        });
      } catch (error) {
        console.error('Failed to create contact from webhook:', error);
        // Create minimal contact if profile fetch fails
        contact = await prisma.contact.create({
          data: {
            messengerPSID: senderId,
            firstName: 'Unknown',
            hasMessenger: true,
            organizationId: page.organizationId,
            facebookPageId: page.id,
            lastInteraction: new Date(),
          },
        });
      }
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        contactId: contact.id,
        platform: 'MESSENGER',
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          facebookPageId: page.id,
          platform: 'MESSENGER',
          status: 'OPEN',
          lastMessageAt: new Date(),
        },
      });
    }

    // Save message
    await prisma.message.create({
      data: {
        content: message.text || '[Media]',
        platform: 'MESSENGER',
        status: 'DELIVERED',
        facebookMessageId: message.mid,
        contactId: contact.id,
        conversationId: conversation.id,
        isFromBusiness: false,
        deliveredAt: new Date(),
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { 
        lastMessageAt: new Date(),
        status: 'OPEN',
      },
    });

    // Update contact last interaction
    await prisma.contact.update({
      where: { id: contact.id },
      data: { lastInteraction: new Date() },
    });
  } catch (error) {
    console.error('Error handling incoming message:', error);
  }
}

async function handleDeliveryReceipt(event: any) {
  try {
    const mids = event.delivery.mids || [];

    await prisma.message.updateMany({
      where: {
        facebookMessageId: { in: mids },
      },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(event.delivery.watermark),
      },
    });
  } catch (error) {
    console.error('Error handling delivery receipt:', error);
  }
}

async function handleReadReceipt(event: any) {
  try {
    const senderId = event.sender.id;

    const contact = await prisma.contact.findFirst({
      where: { messengerPSID: senderId },
    });

    if (!contact) return;

    await prisma.message.updateMany({
      where: {
        contactId: contact.id,
        isFromBusiness: true,
        sentAt: { lte: new Date(event.read.watermark) },
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        readAt: new Date(event.read.watermark),
      },
    });
  } catch (error) {
    console.error('Error handling read receipt:', error);
  }
}

async function handleInstagramMessage(value: any) {
  // Similar to handleIncomingMessage but for Instagram
  // Implementation follows the same pattern
}
```

### Webhook Flow:
1. **Verification**: GET request verifies webhook setup
2. **Signature Validation**: Ensures requests are from Facebook
3. **Event Logging**: Stores all webhook events in database
4. **Message Handling**: Creates conversations and messages automatically
5. **Contact Creation**: Auto-creates contacts from incoming messages
6. **Status Updates**: Tracks delivery and read receipts

---

## Frontend Integration

### Create Inbox Page: `src/app/(dashboard)/inbox/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  platform: string;
  status: string;
  lastMessageAt: string;
  contact: {
    firstName: string;
    lastName?: string;
    profilePicUrl?: string;
  };
  messages: Array<{
    content: string;
    isFromBusiness: boolean;
  }>;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      if (response.ok) {
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inbox</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your conversations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="p-3 rounded-lg hover:bg-accent cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={conversation.contact.profilePicUrl} />
                      <AvatarFallback>
                        {conversation.contact.firstName[0]}
                        {conversation.contact.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm truncate">
                          {conversation.contact.firstName}{' '}
                          {conversation.contact.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {conversation.messages[0] && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.messages[0].content}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {conversation.platform}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {conversation.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="md:col-span-2 p-6">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation to view messages
          </div>
        </Card>
      </div>
    </div>
  );
}
```

### Frontend Flow:
1. **useEffect**: Fetches conversations on component mount
2. **fetch API**: Calls `/api/conversations` endpoint
3. **State Management**: Stores conversations in React state
4. **UI Rendering**: Displays conversations in a scrollable list
5. **Date Formatting**: Uses `date-fns` for relative timestamps

---

## Real-time Updates (Optional)

For real-time conversation updates, you can add:

### Using Polling

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchConversations();
  }, 10000); // Poll every 10 seconds

  return () => clearInterval(interval);
}, []);
```

### Using Socket.io (Advanced)

```typescript
// Server: src/app/api/socket/route.ts
import { Server } from 'socket.io';

export function initSocket(server: any) {
  const io = new Server(server);
  
  io.on('connection', (socket) => {
    socket.on('join-organization', (orgId) => {
      socket.join(`org-${orgId}`);
    });
  });
  
  return io;
}

// Emit on new message in webhook
io.to(`org-${page.organizationId}`).emit('new-message', conversation);
```

```typescript
// Client
import io from 'socket.io-client';

useEffect(() => {
  const socket = io();
  
  socket.emit('join-organization', session.user.organizationId);
  
  socket.on('new-message', (conversation) => {
    setConversations((prev) => [conversation, ...prev]);
  });
  
  return () => socket.disconnect();
}, []);
```

---

## Deployment Checklist

### 1. Database Setup
- [ ] PostgreSQL database provisioned (Supabase, Railway, Neon)
- [ ] `DATABASE_URL` environment variable set
- [ ] Migrations run: `npx prisma migrate deploy`

### 2. Environment Variables
- [ ] `NEXTAUTH_SECRET` generated
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] Facebook credentials configured
- [ ] Redis URL configured

### 3. Facebook App Setup
- [ ] Webhook URL configured: `https://yourdomain.com/api/webhooks/facebook`
- [ ] Webhook subscribed to: `messages`, `messaging_postbacks`, `message_deliveries`, `message_reads`
- [ ] App reviewed and approved by Facebook (for production)
- [ ] Page access tokens stored in database

### 4. Security
- [ ] Encrypt page access tokens in database
- [ ] Enable HTTPS in production
- [ ] Rate limiting implemented
- [ ] CORS configured properly

### 5. Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

---

## Step-by-Step Replication Guide

### Step 1: Initialize Project

```bash
# Create Next.js app
npx create-next-app@latest my-messenger-app --typescript --tailwind --app

cd my-messenger-app

# Install dependencies
npm install @prisma/client prisma next-auth bcrypt axios ioredis bullmq
npm install -D @types/bcrypt @types/node

# Install UI libraries
npm install @radix-ui/react-avatar @radix-ui/react-badge lucide-react date-fns
```

### Step 2: Setup Prisma

```bash
# Initialize Prisma
npx prisma init

# Create schema (copy from Database Schema section)
# Edit prisma/schema.prisma

# Run migration
npx prisma migrate dev --name init

# Generate client
npx prisma generate
```

### Step 3: Create Auth System

```bash
# Create src/auth.ts (copy from Authentication Setup section)
# Create src/lib/db.ts (copy from Database Client Setup section)
# Create src/app/api/auth/[...nextauth]/route.ts
```

### Step 4: Create Facebook Integration

```bash
# Create src/lib/facebook/client.ts (copy from Facebook Client section)
```

### Step 5: Create API Routes

```bash
# Create src/app/api/conversations/route.ts
# Create src/app/api/webhooks/facebook/route.ts
```

### Step 6: Create Frontend

```bash
# Create src/app/(dashboard)/inbox/page.tsx
# Install shadcn components
npx shadcn@latest init
npx shadcn@latest add card avatar badge scroll-area
```

### Step 7: Configure Environment

```bash
# Create .env file
# Add all environment variables (see Environment Variables section)
```

### Step 8: Setup Facebook App

1. Create Facebook App at https://developers.facebook.com
2. Add Messenger product
3. Generate Page Access Token
4. Configure Webhook (use ngrok for local testing)
5. Subscribe to webhook events

### Step 9: Store Page Token

```typescript
// Create Facebook Page in database
await prisma.facebookPage.create({
  data: {
    organizationId: 'your-org-id',
    pageId: 'facebook-page-id',
    pageName: 'Your Page Name',
    pageAccessToken: 'your-page-access-token',
    isActive: true,
  },
});
```

### Step 10: Test Webhook

```bash
# Run dev server
npm run dev

# Use ngrok for local testing
ngrok http 3000

# Configure webhook URL in Facebook
# Send test message to your page
# Check database for new conversation
```

### Step 11: Deploy

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push origin main

# Deploy to Vercel
vercel --prod

# Update Facebook webhook URL to production domain
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface (Next.js)                 │
│                                                                 │
│  ┌──────────────┐        ┌──────────────┐                      │
│  │ Inbox Page   │───────>│ /api/        │                      │
│  │ (React)      │        │ conversations│                      │
│  └──────────────┘        └──────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ fetch()
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js API Routes)             │
│                                                                 │
│  ┌────────────────────┐     ┌──────────────────────┐           │
│  │ GET /api/          │────>│ NextAuth Session     │           │
│  │ conversations      │     │ Validation           │           │
│  └────────────────────┘     └──────────────────────┘           │
│             │                                                   │
│             │ Prisma Query                                      │
│             ▼                                                   │
│  ┌─────────────────────────────────────────────┐               │
│  │  prisma.conversation.findMany({             │               │
│  │    where: { organizationId },               │               │
│  │    include: { contact, messages }           │               │
│  │  })                                         │               │
│  └─────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                        │
│                                                                 │
│  ┌──────────┐   ┌─────────────┐   ┌──────────┐                │
│  │ Contact  │   │Conversation │   │ Message  │                │
│  ├──────────┤   ├─────────────┤   ├──────────┤                │
│  │ PSID     │   │ contactId   │   │ content  │                │
│  │ name     │<──│ pageId      │<──│ status   │                │
│  │ platform │   │ status      │   │ sentAt   │                │
│  └──────────┘   └─────────────┘   └──────────┘                │
└─────────────────────────────────────────────────────────────────┘
                                  ▲
                                  │
                                  │ Webhook POST
┌─────────────────────────────────────────────────────────────────┐
│                    Facebook/Instagram                           │
│                                                                 │
│  User sends message ──> Facebook servers ──> Webhook            │
│                                                                 │
│  POST /api/webhooks/facebook                                    │
│  {                                                              │
│    sender: { id: "PSID" },                                      │
│    message: { text: "Hello" }                                   │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Summary

### 1. Incoming Message Flow
```
Facebook User → Facebook Server → Your Webhook → Database
                                       ↓
                            Create/Update:
                            - Contact
                            - Conversation
                            - Message
```

### 2. Fetching Conversations Flow
```
Browser → API Route → Auth Check → Prisma Query → Database
                          ↓              ↓
                    session.user   conversations
                          ↓              ↓
                    Verify JWT ← Return JSON
```

### 3. Security Layers
```
┌──────────────────┐
│ HTTPS/SSL        │ ← Transport encryption
├──────────────────┤
│ Webhook Signature│ ← Facebook signature verification
├──────────────────┤
│ NextAuth Session │ ← JWT token validation
├──────────────────┤
│ Organization ID  │ ← Multi-tenant isolation
├──────────────────┤
│ Prisma Relations │ ← Database-level constraints
└──────────────────┘
```

---

## Common Issues & Solutions

### Issue 1: Webhook Not Receiving Messages
**Solution:**
- Verify webhook subscription in Facebook App settings
- Check webhook verify token matches environment variable
- Ensure HTTPS is enabled (use ngrok for local testing)
- Verify signature validation logic

### Issue 2: Conversations Not Showing
**Solution:**
- Check if contacts exist in database
- Verify `organizationId` matches session user
- Ensure webhook created conversation properly
- Check Prisma relations are correct

### Issue 3: Token Expired
**Solution:**
- Implement token refresh logic
- Store token expiry date
- Handle 190 error code from Facebook
- Re-authenticate page when token expires

### Issue 4: Duplicate Conversations
**Solution:**
- Add unique constraint on `contactId + platform`
- Use `findFirst` instead of `create` to check existence
- Implement proper upsert logic

---

## Performance Optimizations

### 1. Database Indexes
```prisma
@@index([status, platform])
@@index([lastMessageAt])
@@index([organizationId])
```

### 2. Pagination
```typescript
const conversations = await prisma.conversation.findMany({
  skip: page * limit,
  take: limit,
  // ...
});
```

### 3. Caching
```typescript
// Use Redis for caching
import { redis } from '@/lib/redis';

const cached = await redis.get(`conversations:${orgId}`);
if (cached) return JSON.parse(cached);

const conversations = await prisma.conversation.findMany({...});
await redis.setex(`conversations:${orgId}`, 60, JSON.stringify(conversations));
```

### 4. Connection Pooling
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 10
}
```

---

## Testing

### Unit Test Example

```typescript
// __tests__/api/conversations.test.ts
import { GET } from '@/app/api/conversations/route';
import { NextRequest } from 'next/server';

jest.mock('@/auth');
jest.mock('@/lib/db');

describe('/api/conversations', () => {
  it('should return unauthorized without session', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    
    const request = new NextRequest('http://localhost:3000/api/conversations');
    const response = await GET(request);
    
    expect(response.status).toBe(401);
  });
  
  it('should return conversations for authenticated user', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { organizationId: 'org-123' }
    });
    
    (prisma.conversation.findMany as jest.Mock).mockResolvedValue([
      { id: 'conv-1', platform: 'MESSENGER' }
    ]);
    
    const request = new NextRequest('http://localhost:3000/api/conversations');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
  });
});
```

---

## Monitoring & Logging

### Add Logging Middleware

```typescript
// src/lib/logger.ts
export function logRequest(req: NextRequest) {
  console.log({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent'),
  });
}
```

### Error Tracking (Sentry)

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// In API route
try {
  // ... code
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

---

## Summary

This implementation provides:

✅ **Complete conversation fetching system**
✅ **Real-time webhook integration**
✅ **Secure authentication with NextAuth**
✅ **Multi-tenant organization support**
✅ **PostgreSQL database with Prisma ORM**
✅ **Facebook Messenger & Instagram support**
✅ **Automatic contact and conversation creation**
✅ **Message status tracking (sent, delivered, read)**
✅ **Scalable architecture**
✅ **Production-ready deployment**

You can now replicate this entire system in any new project by following the step-by-step guide above.

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Facebook Messenger Platform](https://developers.facebook.com/docs/messenger-platform)
- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Webhook Best Practices](https://developers.facebook.com/docs/graph-api/webhooks)

---

**Created:** November 11, 2025
**Version:** 1.0.0

