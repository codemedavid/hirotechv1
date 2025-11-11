# Credentials Template for Conversation System

Use this template to gather and organize all credentials needed for replicating the conversation fetching system in a new project.

---

## 📋 Project Information

**Project Name:** `_______________________`

**Environment:** 
- [ ] Development
- [ ] Staging
- [ ] Production

**Date Setup:** `_______________________`

---

## 🗄️ Database Credentials

### PostgreSQL Database

**Provider:** (Supabase / Railway / Neon / AWS RDS / Other)
```
_______________________
```

**Connection String:**
```env
DATABASE_URL="postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=public"
```

**Fill in:**
- **Username:** `_______________________`
- **Password:** `_______________________`
- **Host:** `_______________________`
- **Port:** `_______________________` (default: 5432)
- **Database Name:** `_______________________`

**SSL Mode (for production):**
```
?sslmode=require
```

**Complete Connection String:**
```
_______________________
_______________________
_______________________
```

---

## 🔐 Authentication (NextAuth.js)

### NextAuth Secret

**Generate with:**
```bash
openssl rand -base64 32
```

**NEXTAUTH_SECRET:**
```
_______________________
_______________________
```

### NextAuth URL

**Development:**
```env
NEXTAUTH_URL="http://localhost:3000"
```

**Production:**
```env
NEXTAUTH_URL="https://[YOUR-DOMAIN].com"
```

**Your Domain:** `_______________________`

**Complete NEXTAUTH_URL:**
```
_______________________
```

---

## 📘 Facebook App Credentials

### Facebook App Setup

**App Dashboard URL:** https://developers.facebook.com/apps/

**App ID:**
```
_______________________
```

**App Secret:**
```
_______________________
```

**App Name:** `_______________________`

**App Type:** (Business / Consumer / Other)
```
_______________________
```

### Facebook Page Information

**Page Name:** `_______________________`

**Page ID:**
```
_______________________
```

**Page Access Token:**
```
_______________________
_______________________
_______________________
```

> ⚠️ **Security Note:** This token should be encrypted in your database. Never commit it to version control.

**Token Expires:** (Never / Date: _______)

**Token Permissions:**
- [ ] pages_messaging
- [ ] pages_read_engagement
- [ ] pages_manage_metadata
- [ ] instagram_basic
- [ ] instagram_manage_messages

### Instagram Business Account (Optional)

**Connected to Page:** Yes / No

**Instagram Account ID:**
```
_______________________
```

**Instagram Username:** `@_______________________`

---

## 🪝 Webhook Configuration

### Webhook Verify Token

**Custom string (set by you):**
```env
FACEBOOK_WEBHOOK_VERIFY_TOKEN="[ANY-RANDOM-STRING]"
```

**Your Verify Token:**
```
_______________________
```

**Generate random token with:**
```bash
openssl rand -hex 32
```

### Webhook URL

**Development (with ngrok):**
```
https://[RANDOM].ngrok.io/api/webhooks/facebook
```

**Your ngrok URL:** `_______________________`

**Production:**
```
https://[YOUR-DOMAIN].com/api/webhooks/facebook
```

**Your Webhook URL:** `_______________________`

### Webhook Subscriptions

Verify these are checked in Facebook App Settings:

- [ ] messages
- [ ] messaging_postbacks
- [ ] message_deliveries
- [ ] message_reads
- [ ] messaging_optins
- [ ] messaging_referrals

**Webhook Status:** 
- [ ] Verified
- [ ] Subscribed
- [ ] Active

---

## 🔴 Redis Credentials (Optional - for BullMQ)

**Provider:** (Upstash / Railway / AWS ElastiCache / Local)
```
_______________________
```

**Redis URL:**
```env
REDIS_URL="redis://[USERNAME]:[PASSWORD]@[HOST]:[PORT]"
```

**Fill in:**
- **Host:** `_______________________`
- **Port:** `_______________________` (default: 6379)
- **Password:** `_______________________`

**Complete Redis URL:**
```
_______________________
```

**For Upstash (serverless Redis):**
```env
REDIS_URL="rediss://default:[PASSWORD]@[HOST]:[PORT]"
```

---

## 🚀 Deployment Platform

### Vercel

**Project Name:** `_______________________`

**Project URL:** `_______________________`

**Git Repository:**
```
https://github.com/[USERNAME]/[REPO]
```

**Your Repo:** `_______________________`

**Team/Account:** `_______________________`

### Environment Variables in Vercel

Set these in: Vercel Dashboard → Project → Settings → Environment Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `[FROM ABOVE]` | Production, Preview, Development |
| `NEXTAUTH_URL` | `[FROM ABOVE]` | Production, Preview |
| `NEXTAUTH_SECRET` | `[FROM ABOVE]` | Production, Preview, Development |
| `FACEBOOK_APP_ID` | `[FROM ABOVE]` | Production, Preview, Development |
| `FACEBOOK_APP_SECRET` | `[FROM ABOVE]` | Production, Preview, Development |
| `FACEBOOK_WEBHOOK_VERIFY_TOKEN` | `[FROM ABOVE]` | Production, Preview, Development |
| `REDIS_URL` | `[FROM ABOVE]` | Production, Preview |

**Status:**
- [ ] All variables added to Vercel
- [ ] Deployment successful
- [ ] Production URL working

---

## 👤 Initial User Account

### Admin User for Testing

**Email:** `_______________________`

**Password:** `_______________________`

**Name:** `_______________________`

**Organization Name:** `_______________________`

**Create user in database:**
```sql
-- First, create organization
INSERT INTO "Organization" (id, name, slug, "createdAt", "updatedAt")
VALUES (
  'org-1',
  '[ORGANIZATION-NAME]',
  '[organization-slug]',
  NOW(),
  NOW()
);

-- Then create user
INSERT INTO "User" (id, email, password, name, role, "organizationId", "createdAt", "updatedAt")
VALUES (
  'user-1',
  '[EMAIL]',
  '[BCRYPT-HASHED-PASSWORD]',
  '[NAME]',
  'ADMIN',
  'org-1',
  NOW(),
  NOW()
);
```

**Generate bcrypt password:**
```javascript
// Node.js
const bcrypt = require('bcrypt');
bcrypt.hash('your-password', 10, (err, hash) => {
  console.log(hash);
});
```

**Your Hashed Password:**
```
_______________________
_______________________
```

---

## 📊 Database Setup Commands

### Record your setup steps:

**1. Database created:**
```bash
# Date: _______
# Command: _______________________
```

**2. Prisma initialized:**
```bash
npx prisma init
# Date: _______
```

**3. Schema created:**
```bash
# Date: _______
# File: prisma/schema.prisma
```

**4. Migration run:**
```bash
npx prisma migrate dev --name init
# Date: _______
# Status: [ ] Success [ ] Failed
```

**5. Client generated:**
```bash
npx prisma generate
# Date: _______
```

---

## 🧪 Testing Checklist

### Local Development

- [ ] Database connection works
- [ ] NextAuth login works
- [ ] Facebook page connected
- [ ] Webhook receives test message
- [ ] Conversation appears in inbox
- [ ] Can send message back

### Production Deployment

- [ ] Environment variables set
- [ ] Database accessible from production
- [ ] Webhook URL updated in Facebook
- [ ] SSL certificate active
- [ ] First production message received
- [ ] Conversations fetching correctly

---

## 📝 Notes & Issues

**Setup Issues:**
```
_______________________
_______________________
_______________________
```

**Solutions Applied:**
```
_______________________
_______________________
_______________________
```

**Future Improvements:**
```
_______________________
_______________________
_______________________
```

---

## 🔄 Credential Rotation Schedule

**Database Password:**
- [ ] Change every 90 days
- Last changed: _______
- Next change: _______

**NEXTAUTH_SECRET:**
- [ ] Change every 6 months
- Last changed: _______
- Next change: _______

**Facebook Page Access Token:**
- [ ] Refresh before expiry
- Expires: _______
- Set reminder: _______

---

## 📞 Support Contacts

**Database Provider Support:**
- Website: _______________________
- Email: _______________________
- Phone: _______________________

**Hosting Provider Support:**
- Website: _______________________
- Email: _______________________
- Chat: _______________________

**Team Members with Access:**

| Name | Role | Email | Has Access To |
|------|------|-------|---------------|
| _______ | _______ | _______ | _______ |
| _______ | _______ | _______ | _______ |
| _______ | _______ | _______ | _______ |

---

## 🔒 Security Checklist

### Before Going to Production

- [ ] All credentials stored securely (1Password, LastPass, etc.)
- [ ] `.env` file in `.gitignore`
- [ ] No credentials committed to git
- [ ] Page access tokens encrypted in database
- [ ] HTTPS enabled on production domain
- [ ] Webhook signature verification working
- [ ] Rate limiting implemented
- [ ] CORS configured properly
- [ ] Database backups configured
- [ ] Error logging set up (Sentry, LogRocket, etc.)
- [ ] Team members trained on security practices

---

## 📦 Backup Information

**Database Backups:**
- Provider: _______________________
- Frequency: _______________________
- Retention: _______________________
- Last backup: _______________________

**Backup Restore Tested:**
- [ ] Yes
- [ ] No
- Last tested: _______________________

**Backup Storage Location:**
```
_______________________
```

---

## 🎯 Completion Checklist

### Phase 1: Setup
- [ ] All credentials gathered
- [ ] Database provisioned
- [ ] Environment variables set
- [ ] Code deployed

### Phase 2: Integration
- [ ] Facebook app configured
- [ ] Webhook connected
- [ ] Test message sent
- [ ] First conversation received

### Phase 3: Testing
- [ ] All features tested
- [ ] Performance verified
- [ ] Security audit passed
- [ ] Documentation updated

### Phase 4: Launch
- [ ] Production environment ready
- [ ] Team trained
- [ ] Monitoring active
- [ ] Launched! 🎉

---

## 📄 Environment File (.env)

**Complete `.env` file for reference:**

```env
# Database
DATABASE_URL="postgresql://[USER]:[PASS]@[HOST]:[PORT]/[DB]?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[GENERATE-WITH-OPENSSL]"

# Facebook
FACEBOOK_APP_ID="[YOUR-APP-ID]"
FACEBOOK_APP_SECRET="[YOUR-APP-SECRET]"
FACEBOOK_WEBHOOK_VERIFY_TOKEN="[YOUR-VERIFY-TOKEN]"

# Redis (Optional)
REDIS_URL="redis://localhost:6379"

# Node
NODE_ENV="development"
```

---

## ✅ Final Verification

**Date Completed:** `_______________________`

**Completed By:** `_______________________`

**System Status:**
- [ ] Fully operational
- [ ] Partially operational
- [ ] Under development

**Production URL:** `_______________________`

**Notes:**
```
_______________________
_______________________
_______________________
```

---

**Template Version:** 1.0.0
**Last Updated:** November 11, 2025

---

> 💡 **Tip:** Keep this document secure and update it whenever credentials change or new services are added.

> ⚠️ **Warning:** Never commit this file with filled-in credentials to version control!

