# 🚨 Campaign Not Sending - START HERE

## Quick Fix Steps (5 Minutes)

### Step 1: Check if contacts have PSIDs

```bash
npx tsx scripts/check-contacts-psids.ts
```

**Look for this:**
```
📨 Can receive Messenger campaigns: X
```

- If X = 0 → **Go to Step 2**
- If X > 0 → **Go to Step 3**

---

### Step 2: Fix Contacts (If X = 0)

Your contacts don't have PSIDs! Fix this:

**Option 1 - Re-sync (Fastest):**
1. Open your app
2. Go to Settings → Integrations  
3. Click "Sync Contacts"
4. Wait 30 seconds
5. Run Step 1 again

**Option 2 - Wait for messages:**
PSIDs are added automatically when users message your page.

---

### Step 3: Test Sending

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Watch the terminal logs** (this is KEY!)

3. **Create a test campaign:**
   - Select 1-3 contacts
   - Write a simple message
   - Click "Start Campaign"

4. **Look at your terminal** - You should see:
   ```
   🚀 Starting campaign...
   📊 Target contacts found: 3
   📋 Prepared 3 messages for sending
   🔄 Starting background processing for 3 messages
   📤 Sending message 1/3...
   ✅ Message 1 sent successfully
   📤 Sending message 2/3...
   ✅ Message 2 sent successfully
   📤 Sending message 3/3...
   ✅ Message 3 sent successfully
   📊 Background sending completed: 3 sent, 0 failed
   ✅ Campaign marked as COMPLETED
   ```

---

## 🔴 Common Problems & Quick Fixes

### Problem: "Target contacts found: 0"

**Cause:** No contacts have PSIDs  
**Fix:** Go to Step 2 above

---

### Problem: "No messages to send in background"

**Cause:** All contacts filtered out (no PSIDs)  
**Fix:** Re-sync contacts in Settings → Integrations

---

### Problem: Messages send but campaign stuck on "SENDING"

**Cause:** Status update failed  
**Fix:** Manually update in database:
```sql
UPDATE "Campaign" 
SET status = 'COMPLETED', "completedAt" = NOW()
WHERE status = 'SENDING';
```

---

### Problem: "Invalid OAuth access token"

**Cause:** Facebook token expired  
**Fix:** Reconnect Facebook page in Settings → Integrations

---

### Problem: No logs appearing in terminal

**Cause:** Server not running or not watching console  
**Fix:** 
1. Make sure `npm run dev` is running
2. Look at the terminal where the server is running
3. Restart the server

---

## 📊 What to Expect

### Timeline for Campaign Sending:

**Small (< 10 contacts):**
- 1-5 minutes
- Messages sent with 36-second delays (rate limiting)

**Medium (10-50 contacts):**
- 10-30 minutes
- Progress visible in terminal logs

**Large (> 50 contacts):**
- 30+ minutes
- Consider using Redis for better management

### What You'll See:

**In Terminal:**
```
🚀 📊 📋 🔄 📤 ✅ ✅ ✅ 📊 ✅
```
(Emoji indicators show progress)

**In UI:**
- Status changes from "SENDING" to "COMPLETED"
- Sent count increases
- Progress bar fills to 100%

**In Facebook Messenger:**
- Recipients receive the messages
- (Check your own test account first!)

---

## 🆘 Still Not Working?

### Check These 3 Things:

1. **Server Running?**
   ```bash
   npm run dev
   ```

2. **Contacts Have PSIDs?**
   ```bash
   npx tsx scripts/check-contacts-psids.ts
   ```

3. **Facebook Token Valid?**
   - Go to Settings → Integrations
   - Look for expired token warning
   - Reconnect if needed

---

## 📖 More Help

**Full troubleshooting guide:**
Read `CAMPAIGN_STUCK_SENDING_DEBUG.md`

**Technical details:**
Read `CAMPAIGN_SENDING_ISSUES_ANALYSIS.md`

**Complete summary:**
Read `CAMPAIGN_FIXES_COMPLETE.md`

---

## ✅ Success = See This

When it's working, your terminal shows:
```
🚀 Starting campaign abc123...
✅ Campaign found: Test Campaign  
📊 Target contacts found: 3
📝 Updating campaign status to SENDING...
📨 Using direct send mode (Redis not available)
⏱️  Delay between messages: 36000ms (rate limit: 100 msg/hr)
📋 Prepared 3 messages for sending
🎯 Campaign started in direct mode. Messages will be sent in the background.
🔄 Starting background processing for 3 messages (Campaign: abc123)
📤 Sending message 1/3...
✅ Message 1 sent successfully
📤 Sending message 2/3...
✅ Message 2 sent successfully
📤 Sending message 3/3...
✅ Message 3 sent successfully
📊 Background sending completed: 3 sent, 0 failed
✅ Campaign abc123 marked as COMPLETED
```

**If you see this = Everything works!** 🎉

---

## 🚀 Quick Commands Reference

```bash
# Check contact PSIDs
npx tsx scripts/check-contacts-psids.ts

# Start server (watch this terminal!)
npm run dev

# Start worker (if using Redis)
npm run worker

# Build check
npx tsc --noEmit
```

---

**Remember:** Messages are sent in the BACKGROUND. Watch your **terminal logs** to see progress!

