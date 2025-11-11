# Quick Start: Conversation Fetching System

## 🚀 5-Minute Setup Guide

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Facebook Developer Account
- Facebook Page

---

## Step 1: Clone & Install (2 min)

```bash
# Create new Next.js project
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app

# Install core dependencies
npm install @prisma/client prisma next-auth bcrypt axios
npm install -D @types/bcrypt

# Install UI dependencies
npm install @radix-ui/react-avatar @radix-ui/react-card lucide-react date-fns
```

---

## Step 2: Environment Setup (1 min)

Create `.env`:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
FACEBOOK_APP_ID="your_app_id"
FACEBOOK_APP_SECRET="your_app_secret"
FACEBOOK_WEBHOOK_VERIFY_TOKEN="any_random_string"
```

---

## Step 3: Database Setup (1 min)

```bash
# Copy schema from CONVERSATION_FETCHING_DOCUMENTATION.md
# Create prisma/schema.prisma

npx prisma generate
npx prisma db push
```

---

## Step 4: Copy Core Files (1 min)

Copy these files from the documentation:

```
✓ src/auth.ts
✓ src/lib/db.ts
✓ src/lib/facebook/client.ts
✓ src/app/api/auth/[...nextauth]/route.ts
✓ src/app/api/conversations/route.ts
✓ src/app/api/webhooks/facebook/route.ts
✓ src/app/(dashboard)/inbox/page.tsx
```

---

## Step 5: Run & Test (30 sec)

```bash
npm run dev
# Visit http://localhost:3000/inbox
```

---

## 🎯 Core Concepts in 30 Seconds

### How Conversations Are Created

```
User messages your page
       ↓
Facebook sends webhook
       ↓
Auto-creates: Contact + Conversation + Message
       ↓
Shows in /inbox
```

### How Conversations Are Fetched

```typescript
// API Route: /api/conversations
prisma.conversation.findMany({
  where: { organizationId },  // Multi-tenant filtering
  include: { contact, messages },  // Include relations
  orderBy: { lastMessageAt: 'desc' },  // Latest first
})
```

### Authentication Flow

```typescript
// Every API call checks:
const session = await auth();
if (!session?.user) return 401;

// Then filters by organization:
where: {
  contact: {
    organizationId: session.user.organizationId
  }
}
```

---

## 📊 Database Schema (Simplified)

```prisma
model Conversation {
  id            String
  contactId     String
  platform      Platform (MESSENGER | INSTAGRAM)
  status        ConversationStatus (OPEN | PENDING | RESOLVED)
  lastMessageAt DateTime
  
  contact  Contact
  messages Message[]
}

model Contact {
  id            String
  messengerPSID String?
  instagramSID  String?
  firstName     String
  lastName      String?
  
  conversations Conversation[]
  messages      Message[]
}

model Message {
  id             String
  content        String
  platform       Platform
  status         MessageStatus
  conversationId String
  contactId      String
  isFromBusiness Boolean
  
  conversation Conversation
  contact      Contact
}
```

---

## 🔧 Common Tasks

### Task 1: Add New Facebook Page

```typescript
await prisma.facebookPage.create({
  data: {
    organizationId: 'org-id',
    pageId: 'fb-page-id',
    pageName: 'My Page',
    pageAccessToken: 'token',
  },
});
```

### Task 2: Fetch Conversations with Filters

```typescript
const conversations = await prisma.conversation.findMany({
  where: {
    contact: { organizationId: orgId },
    platform: 'MESSENGER',  // Filter by platform
    status: 'OPEN',  // Filter by status
  },
  orderBy: { lastMessageAt: 'desc' },
  take: 50,
  include: {
    contact: true,
    messages: { take: 1, orderBy: { createdAt: 'desc' } },
  },
});
```

### Task 3: Send a Message

```typescript
import { FacebookClient } from '@/lib/facebook/client';

const page = await prisma.facebookPage.findUnique({
  where: { id: pageId },
});

const client = new FacebookClient(page.pageAccessToken);

const result = await client.sendMessengerMessage({
  recipientId: contact.messengerPSID,
  message: 'Hello!',
});

if (result.success) {
  await prisma.message.create({
    data: {
      content: 'Hello!',
      platform: 'MESSENGER',
      contactId: contact.id,
      conversationId: conversation.id,
      isFromBusiness: true,
      status: 'SENT',
      sentAt: new Date(),
    },
  });
}
```

### Task 4: Update Conversation Status

```typescript
await prisma.conversation.update({
  where: { id: conversationId },
  data: { status: 'RESOLVED' },
});
```

---

## 🔐 Security Checklist

- [x] Authentication required for all API routes
- [x] Organization-level data isolation
- [x] Webhook signature verification
- [x] HTTPS in production
- [x] JWT session tokens
- [x] Encrypted page access tokens (recommended)

---

## 🐛 Troubleshooting

### Conversations Not Showing

```typescript
// Check 1: Verify session
const session = await auth();
console.log(session); // Should have organizationId

// Check 2: Check database
const count = await prisma.conversation.count({
  where: { contact: { organizationId: 'your-org-id' } }
});
console.log('Conversations:', count);

// Check 3: Verify relations
const conv = await prisma.conversation.findFirst({
  include: { contact: true, messages: true },
});
console.log(conv);
```

### Webhook Not Working

```bash
# Local testing with ngrok
ngrok http 3000

# Update webhook URL in Facebook:
https://xxxx.ngrok.io/api/webhooks/facebook

# Test webhook
curl -X POST https://xxxx.ngrok.io/api/webhooks/facebook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Authentication Failing

```typescript
// Check NextAuth config
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

// Test login
const result = await signIn('credentials', {
  email: 'test@example.com',
  password: 'password',
  redirect: false,
});
console.log(result);
```

---

## 📈 Performance Tips

### 1. Add Database Indexes

```prisma
model Conversation {
  @@index([status, platform])
  @@index([lastMessageAt])
}

model Contact {
  @@index([organizationId])
  @@index([messengerPSID])
}
```

### 2. Limit Query Results

```typescript
// Good
take: 50

// Better - with pagination
skip: page * limit,
take: limit
```

### 3. Use Select to Reduce Data

```typescript
const conversations = await prisma.conversation.findMany({
  select: {
    id: true,
    platform: true,
    status: true,
    lastMessageAt: true,
    contact: {
      select: {
        firstName: true,
        lastName: true,
        profilePicUrl: true,
      },
    },
    messages: {
      take: 1,
      select: {
        content: true,
        isFromBusiness: true,
      },
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

---

## 🚢 Deploy to Production

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
# Update Facebook webhook URL to production domain
```

### Environment Variables for Production

```env
DATABASE_URL="postgresql://user:pass@prod-db:5432/db?sslmode=require"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="different-from-dev"
FACEBOOK_APP_ID="same"
FACEBOOK_APP_SECRET="same"
FACEBOOK_WEBHOOK_VERIFY_TOKEN="same"
```

---

## 🧪 Test the System

### 1. Test Webhook (Local)

```bash
# Terminal 1: Run app
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Terminal 3: Send test webhook
curl -X POST http://localhost:3000/api/webhooks/facebook \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=$(echo -n '{}' | openssl dgst -sha256 -hmac "$FACEBOOK_APP_SECRET" | cut -d' ' -f2)" \
  -d '{
    "entry": [{
      "messaging": [{
        "sender": {"id": "test-psid"},
        "recipient": {"id": "test-page-id"},
        "message": {"text": "Hello"}
      }]
    }]
  }'
```

### 2. Test API Endpoint

```typescript
// test-api.ts
const response = await fetch('http://localhost:3000/api/conversations', {
  headers: {
    'Cookie': 'next-auth.session-token=YOUR_SESSION_TOKEN',
  },
});

const data = await response.json();
console.log(data);
```

### 3. Test Frontend

```bash
# Open browser
http://localhost:3000/inbox

# Check console for errors
# Verify conversations load
```

---

## 📚 Key Files Reference

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/conversations` | GET | Fetch all conversations |
| `/api/webhooks/facebook` | GET | Verify webhook |
| `/api/webhooks/facebook` | POST | Receive messages |
| `/api/auth/[...nextauth]` | GET/POST | Authentication |

### Database Models

| Model | Purpose |
|-------|---------|
| `Organization` | Multi-tenant isolation |
| `User` | Authentication & permissions |
| `FacebookPage` | Store page tokens |
| `Contact` | Contact profiles |
| `Conversation` | Group messages |
| `Message` | Individual messages |

### Frontend Pages

| Page | Purpose |
|------|---------|
| `/inbox` | View conversations |
| `/login` | User login |
| `/contacts` | Manage contacts |

---

## 🎓 Next Steps

1. **Add Real-time Updates**: Implement Socket.io for live message updates
2. **Add Message Sending**: Create UI to reply to messages
3. **Add Filters**: Filter by platform, status, date range
4. **Add Search**: Search conversations by contact name or message content
5. **Add Pagination**: Handle large conversation lists
6. **Add Typing Indicators**: Show when user is typing
7. **Add File Attachments**: Support images, videos, files
8. **Add Templates**: Quick reply templates
9. **Add Analytics**: Track conversation metrics
10. **Add Notifications**: Desktop/push notifications for new messages

---

## 🆘 Getting Help

- Full Documentation: `CONVERSATION_FETCHING_DOCUMENTATION.md`
- Prisma Docs: https://prisma.io/docs
- Next.js Docs: https://nextjs.org/docs
- Facebook Messenger Platform: https://developers.facebook.com/docs/messenger-platform
- NextAuth.js Docs: https://next-auth.js.org

---

## 🎉 You're Done!

You now have a fully functional conversation fetching system that:

✅ Receives messages via webhook
✅ Auto-creates contacts and conversations
✅ Fetches conversations with authentication
✅ Displays in a beautiful UI
✅ Supports multi-tenancy
✅ Tracks message status
✅ Is production-ready

**Happy coding! 🚀**

