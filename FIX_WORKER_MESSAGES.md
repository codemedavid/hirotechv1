# Fix: Campaign Messages Not Sending

## Quick Diagnosis

Run this command to diagnose the issue:

```bash
npm run diagnose:worker
```

This will check:
- ✅ Redis connection
- ✅ BullMQ queue status
- ✅ Environment variables
- ✅ Database campaigns
- ✅ Contact availability

---

## Common Issues & Solutions

### Issue 1: Redis Not Running

**Symptoms:**
- Worker fails to start
- Error: `ECONNREFUSED` or `connect ECONNREFUSED`

**Solution:**

```bash
# Option A: Docker (Recommended)
docker run -d --name redis -p 6379:6379 redis:alpine

# Option B: Docker - if redis container exists
docker start redis

# Option C: Local installation
# Mac: brew services start redis
# Windows: Install from https://github.com/microsoftarchive/redis/releases
# Linux: sudo systemctl start redis
```

---

### Issue 2: REDIS_URL Not Set

**Symptoms:**
- Worker starts but can't connect
- Error: `REDIS_URL environment variable is not set`

**Solution:**

Add to `.env.local`:

```bash
REDIS_URL=redis://localhost:6379

# Or for cloud Redis (Upstash, etc):
# REDIS_URL=redis://:password@host:port
```

Then restart both dev server and worker:

```bash
# Terminal 1
npm run dev

# Terminal 2  
npm run worker
```

---

### Issue 3: No Jobs in Queue

**Symptoms:**
- Worker runs but processes nothing
- Queue shows 0 waiting, 0 active jobs

**Solution:**

This means no campaign has been started yet. To fix:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **In another terminal, start worker:**
   ```bash
   npm run worker
   ```

3. **In the app:**
   - Go to Campaigns page
   - Click on a campaign or create new one
   - Click "Start Campaign" button
   - Watch the worker terminal - you should see jobs processing

---

### Issue 4: Campaign Stuck in SENDING Status

**Symptoms:**
- Campaign shows SENDING status
- sentCount stays at 0
- No error messages

**Possible Causes & Solutions:**

#### A. Worker Not Running
```bash
# Make sure worker is running
npm run worker
```

#### B. No Valid Contact PSIDs/SIDs
```bash
# Check diagnostic
npm run diagnose:worker

# Look for: "Contacts available: Messenger: 0, Instagram: 0"
```

**Solution:** Sync contacts from Facebook Pages:
- Go to Settings → Facebook Pages
- Ensure page is connected
- Contacts should automatically sync when users message your page

#### C. Invalid Facebook Page Token
- Go to Settings → Facebook Pages
- Reconnect the Facebook page
- This will refresh the access token

#### D. Facebook API Rate Limits
- Facebook limits message sending
- Check your campaign rate limit setting
- Default is 100 messages per hour

---

### Issue 5: Messages Failing

**Symptoms:**
- Worker processes jobs but they fail
- `failedCount` increases
- Error messages in worker terminal

**Common Errors:**

#### "No recipient ID (PSID) available"
**Cause:** Contact doesn't have a valid Messenger PSID or Instagram SID

**Solution:** 
- Contacts need to message your page first to get PSID/SID
- Only contacts who have interacted with your page can receive messages

#### Facebook API Error: "Invalid OAuth access token"
**Cause:** Page access token expired or invalid

**Solution:**
1. Go to Settings → Facebook Pages
2. Reconnect the page
3. This will refresh the token

#### Facebook API Error: "This message is sent outside of allowed window"
**Cause:** Trying to send message outside 24-hour window without proper tag

**Solution:**
- Use message tags (CONFIRMED_EVENT_UPDATE, POST_PURCHASE_UPDATE, etc.)
- Or ensure messages are sent within 24 hours of user's last message
- Select appropriate tag when creating campaign

#### Facebook API Error: "Rate limit exceeded"
**Cause:** Sending messages too fast

**Solution:**
- Reduce campaign rate limit (edit campaign settings)
- Default: 100 messages/hour
- Try: 50 messages/hour or lower

---

## Complete Setup From Scratch

If nothing is working, start fresh:

### Step 1: Stop Everything
```bash
# Stop dev server (Ctrl+C)
# Stop worker (Ctrl+C)
# Stop Redis
docker stop redis
```

### Step 2: Start Redis
```bash
docker rm redis  # Remove old container
docker run -d --name redis -p 6379:6379 redis:alpine
```

### Step 3: Verify Environment
Create/update `.env.local`:
```bash
REDIS_URL=redis://localhost:6379
DATABASE_URL="your-database-url"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-key"
```

### Step 4: Test Redis Connection
```bash
npm run diagnose:worker
```

You should see:
- ✅ REDIS_URL is set
- ✅ Redis is running and accessible
- ✅ Queue is accessible

### Step 5: Start Services
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Worker
npm run worker
```

### Step 6: Start a Campaign

1. Open app: http://localhost:3000
2. Go to Campaigns
3. Create or select a campaign
4. Click "Start Campaign"
5. Watch Terminal 2 (worker) for processing logs

You should see:
```
✅ Job completed
📤 Sending message 1/5...
✅ Message sent successfully
```

---

## Monitoring Campaign Progress

### In the App
- Campaign detail page shows real-time progress
- Auto-refreshes every 3 seconds
- Shows: sent count, failed count, success rate

### In Worker Terminal
```
✅ Job 123 completed
✅ Message sent to John Doe
📊 Progress: 5/10 messages sent
```

### In Redis (Debug)
```bash
# Install Redis CLI
npm install -g redis-cli

# Connect to Redis
redis-cli

# Check queue
KEYS bull:messages:*
LLEN bull:messages:waiting
LLEN bull:messages:active
```

---

## Testing Message Sending

### Quick Test Campaign

1. **Create test campaign:**
   - Name: "Test Campaign"
   - Platform: Messenger
   - Target: Select 1-2 contacts
   - Message: "Hi {firstName}, this is a test!"

2. **Verify requirements:**
   ```bash
   npm run diagnose:worker
   ```
   
   Should show:
   - ✅ Redis running
   - ✅ Queue accessible
   - ✅ At least 1 contact with PSID

3. **Start campaign:**
   - Click "Start Campaign"
   - Should show "SENDING" status

4. **Watch worker terminal:**
   ```
   📥 Queueing message 1/2...
   ✅ Job completed
   📤 Message sent successfully
   ```

5. **Check results:**
   - Campaign status changes to "COMPLETED"
   - sentCount should equal totalRecipients
   - Check Facebook Messenger to verify message delivery

---

## Architecture Overview

Understanding the flow helps debug issues:

```
1. User clicks "Start Campaign" in UI
   ↓
2. API calls startCampaign() function
   ↓
3. startCampaign() finds target contacts
   ↓
4. For each contact, adds job to Redis queue
   ↓
5. Worker picks up job from queue
   ↓
6. Worker sends message via Facebook API
   ↓
7. Worker updates database (message record, campaign stats)
   ↓
8. Job marked as complete
   ↓
9. Process repeats for next message (with rate limiting)
```

### Key Points:

- **Queue System:** Uses BullMQ + Redis
- **Rate Limiting:** Delays between messages (based on campaign settings)
- **Retries:** Failed jobs retry 3 times with exponential backoff
- **Fallback:** If Redis unavailable, sends directly (slower)

---

## Production Deployment

For production, you need:

1. **Managed Redis** (Upstash, Redis Cloud, AWS ElastiCache)
   ```bash
   REDIS_URL=redis://:password@production-redis:6379
   ```

2. **Separate Worker Process**
   - Deploy worker as separate service
   - Use PM2, Docker, Railway, Render, etc.
   - Set environment variables
   - Start command: `npm run worker`

3. **Environment Variables**
   - Set REDIS_URL in both Next.js app and worker
   - Both must connect to same Redis instance

Example Railway deployment:
```bash
# App service
npm run start

# Worker service  
npm run worker
```

Both services need same REDIS_URL environment variable.

---

## Get Help

Still having issues?

1. **Run diagnostic:** `npm run diagnose:worker`
2. **Check worker logs:** Look for error messages
3. **Check browser console:** Look for API errors
4. **Check database:** Verify campaign status and messages

Common log locations:
- Worker: Terminal where `npm run worker` is running
- Next.js: Terminal where `npm run dev` is running  
- Browser: DevTools → Console tab

---

## Summary Checklist

Before asking for help, verify:

- [ ] Redis is running (`docker ps` shows redis container)
- [ ] REDIS_URL is set in .env.local
- [ ] Dev server is running (`npm run dev`)
- [ ] Worker is running (`npm run worker`)
- [ ] Diagnostic passes (`npm run diagnose:worker`)
- [ ] Campaign has been started from UI
- [ ] Contacts have valid PSID/SID
- [ ] Facebook page token is valid
- [ ] No error messages in worker or dev server terminals

If all checked and still not working, provide:
- Worker terminal output
- Diagnostic output
- Any error messages
- Campaign status and stats

