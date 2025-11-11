# Campaign System - Final Setup Steps

## ✅ What's Working

- ✅ Redis connected successfully
- ✅ Worker started and listening for jobs
- ✅ Messages being queued to Redis
- ✅ Campaign UI working

## ❌ What Needs Fixing

### 1. **Redis Eviction Policy** (CRITICAL)

**Current**: `volatile-lru`  
**Required**: `noeviction`

**Why**: BullMQ needs `noeviction` policy to ensure jobs aren't evicted from the queue before processing.

#### Fix Steps:
1. Go to https://app.redislabs.com/
2. Select database: `redis-14778.c326...`
3. Click **"Configuration"** tab
4. Find **"Eviction Policy"**
5. Change to **"noeviction"**
6. Click **"Save"**

### 2. **Database Connection Issue**

**Error**: Can't reach `aws-1-ap-southeast-1.pooler.supabase.com:5432`

**Possible Causes**:
- Network connectivity issue
- Supabase pooler timeout
- Firewall blocking worker connections
- Supabase maintenance

#### Fix Options:

**Option A: Check Supabase Status**
1. Go to https://status.supabase.com/
2. Verify services are operational

**Option B: Test Connection**
```bash
# Test if you can reach Supabase from your network
ping aws-1-ap-southeast-1.pooler.supabase.com
```

**Option C: Use Direct Connection (if pooler has issues)**

Edit `.env.local` and update DATABASE_URL to use DIRECT_URL:
```bash
# Change this:
DATABASE_URL="postgresql://postgres.mrqytcrgqdncxeyfazgg:demet5732595@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true"

# To this (remove pgbouncer):
DATABASE_URL="postgresql://postgres.mrqytcrgqdncxeyfazgg:demet5732595@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

Then restart everything.

---

## 🔄 After Making Changes

### Restart Everything:

```bash
# Terminal 1 (Dev Server)
# Press Ctrl+C to stop
npm run dev

# Terminal 2 (Worker)
# Press Ctrl+C to stop
npm run worker
```

---

## 🧪 Test Campaign Sending

Once both issues are fixed:

1. **Start campaign** in browser
2. **Worker terminal** should show:
   ```
   ✅ Job 1 completed
   ✅ Job 2 completed
   ```
3. **Campaign page** should show sent count increasing

---

## 📊 Expected Output (When Working)

### Worker Terminal:
```
🚀 Starting Campaign Message Worker...
✅ Message worker started and connected to Redis
✅ Worker is running and listening for jobs
✅ Job 1 completed
✅ Job 2 completed
✅ Job 3 completed
```

### Dev Server Terminal:
```
✅ BullMQ connected to Redis at redis-14778...
POST /api/campaigns/.../send 200 in 234ms
```

---

## 🆘 Troubleshooting

### If Jobs Keep Failing:

1. **Check Supabase is accessible**:
   ```bash
   npx prisma db pull
   ```
   Should succeed if database is reachable

2. **Verify .env.local is loaded**:
   ```bash
   echo $DATABASE_URL
   # Should show your Supabase URL
   ```

3. **Check if dev server can connect**:
   - If campaigns page loads, database is reachable
   - Worker should use same connection

4. **Try restarting your computer**:
   - Sometimes network stacks need a reset
   - Ensures clean environment

---

## 📝 Priority Order

**Do these in order**:

1. ✅ **Fix Redis eviction policy** (MUST DO - takes 2 minutes)
2. ⏸️ **Wait 5 minutes** after Redis change for it to take effect  
3. 🔄 **Restart dev server and worker**
4. 🧪 **Test sending a campaign**
5. 🔍 **If still failing**, check Supabase connection

---

## ✅ Success Criteria

You'll know it's working when:
- ✅ No "IMPORTANT! Eviction policy" warnings
- ✅ No database connection errors
- ✅ Jobs show "completed" not "failed"
- ✅ Campaign sent count increases
- ✅ Messages appear in database

---

**Start with fixing the Redis eviction policy - that's the most critical issue!** 🚀

