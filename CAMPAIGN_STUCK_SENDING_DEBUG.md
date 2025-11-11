# Campaign Stuck in "SENDING" Status - Debugging Guide

## 🔴 Problem

Campaigns are stuck in "SENDING" status and no messages are being sent.

## 🔍 Diagnosis Steps

### Step 1: Check Your Terminal/Server Logs

When you start a campaign, you should see logs like this:

```
🚀 Starting campaign abc123...
✅ Campaign found: Summer Promotion
📊 Target contacts found: 10
📝 Updating campaign status to SENDING...
📨 Using direct send mode (Redis not available)
⏱️  Delay between messages: 36000ms (rate limit: 100 msg/hr)
📋 Prepared 10 messages for sending
🎯 Campaign started in direct mode. Messages will be sent in the background.
🔄 Starting background processing for 10 messages (Campaign: abc123)
📤 Sending message 1/10...
✅ Message 1 sent successfully
📤 Sending message 2/10...
✅ Message 2 sent successfully
...
📊 Background sending completed: 10 sent, 0 failed
✅ Campaign abc123 marked as COMPLETED
```

**If you DON'T see these logs**, there's a problem with the campaign start.

### Step 2: Check for Error Messages

Look for these error patterns in your logs:

#### Error: "No target contacts found"
```
❌ No target contacts found for this campaign. Make sure contacts have valid Messenger PSIDs or Instagram SIDs.
```

**Cause:** Your contacts don't have valid PSIDs.  
**Solution:** See "Fix: No Valid PSIDs" section below.

#### Error: "No recipient ID (PSID) available"
```
❌ No recipient ID (PSID) available for contact
```

**Cause:** Contact filtered into campaign but has null PSID.  
**Solution:** This shouldn't happen anymore, but if it does, re-sync contacts.

### Step 3: Run the Diagnostic Script

Check how many of your contacts have valid PSIDs:

```bash
npx tsx scripts/check-contacts-psids.ts
```

This will show you:
- How many contacts have Messenger PSIDs
- How many contacts have Instagram SIDs
- Which contacts have flags but no PSIDs (problem!)
- Recommendations for fixing issues

**Expected Output:**
```
📊 Total contacts: 50

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 MESSENGER ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Valid (has flag + PSID):      10
❌ Invalid (has flag but NO PSID): 40

🎯 CAMPAIGN TARGETING SUMMARY
📨 Can receive Messenger campaigns: 10
📷 Can receive Instagram campaigns: 5
```

### Step 4: Check Database Directly

Query your contacts to see their PSID status:

```sql
-- Check Messenger contacts
SELECT 
  COUNT(*) as total,
  COUNT("messengerPSID") as with_psid,
  COUNT(*) - COUNT("messengerPSID") as without_psid
FROM "Contact"
WHERE "hasMessenger" = true;

-- Check Instagram contacts  
SELECT 
  COUNT(*) as total,
  COUNT("instagramSID") as with_sid,
  COUNT(*) - COUNT("instagramSID") as without_sid
FROM "Contact"
WHERE "hasInstagram" = true;

-- Find problematic contacts
SELECT 
  "firstName",
  "lastName",
  "hasMessenger",
  "hasInstagram",
  "messengerPSID",
  "instagramSID"
FROM "Contact"
WHERE 
  ("hasMessenger" = true AND "messengerPSID" IS NULL)
  OR ("hasInstagram" = true AND "instagramSID" IS NULL)
LIMIT 10;
```

---

## 🔧 Fixes

### Fix 1: No Valid PSIDs (Most Common Issue)

**Problem:** Contacts have `hasMessenger: true` but `messengerPSID: null`

**Why This Happens:**
1. Facebook API limitations prevent direct PSID fetching
2. Contacts synced from conversations without active messages
3. PSIDs only populated when users actively message your page

**Solutions:**

#### Option A: Re-sync Contacts (Recommended)
1. Go to Settings → Integrations
2. Click "Sync Contacts" for your Facebook page
3. Wait for sync to complete
4. Run diagnostic script again to verify

#### Option B: Wait for Users to Message
PSIDs are automatically populated via webhooks when users:
- Send a message to your page
- Reply to your messages
- Engage with your Facebook page

#### Option C: Clean Up Invalid Contacts
Remove contacts that will never have PSIDs:

```sql
-- Delete contacts with flags but no PSIDs
DELETE FROM "Contact"
WHERE 
  ("hasMessenger" = true AND "messengerPSID" IS NULL)
  OR ("hasInstagram" = true AND "instagramSID" IS NULL);
```

**⚠️ Warning:** This deletes contacts permanently!

---

### Fix 2: Campaign Status Stuck

**Problem:** Campaign shows "SENDING" forever

**Causes:**
1. No messages were queued (all contacts filtered out)
2. Background processing crashed
3. Redis worker not running (if using Redis)

**Solutions:**

#### Check if Messages Were Queued
Look for this log:
```
📋 Prepared X messages for sending
```

If X = 0, no messages were sent because no valid contacts.

#### Manually Update Campaign Status
If campaign is truly stuck, update status manually:

```sql
-- Check campaign status
SELECT id, name, status, "totalRecipients", "sentCount", "failedCount"
FROM "Campaign"
WHERE status = 'SENDING';

-- Update stuck campaign to COMPLETED
UPDATE "Campaign"
SET 
  status = 'COMPLETED',
  "completedAt" = NOW()
WHERE id = 'your-campaign-id-here';
```

#### Check Redis Worker (If Using Redis)
If you see:
```
📨 Using Redis queue for message sending
```

Make sure the worker is running:
```bash
npm run worker
```

---

### Fix 3: Messages Not Sending (Even With Valid PSIDs)

**Problem:** Contacts have PSIDs but messages still fail

**Possible Causes:**

#### A. Facebook Access Token Expired
```
❌ Error from Facebook: Invalid OAuth access token
```

**Solution:** Reconnect your Facebook page in Settings → Integrations

#### B. Facebook Page Permissions
```
❌ Error from Facebook: This page does not have permission to message this user
```

**Solution:**
- User must have messaged your page within 24 hours, OR
- Use a valid message tag (see `MESSAGE_TAGS` in code)

#### C. Rate Limiting
```
❌ Error from Facebook: Too many messages sent too quickly
```

**Solution:** Campaign uses rate limiting by default, but you can adjust:
- Default: 100 messages/hour
- Increase delay between messages
- Facebook limits: ~1000 messages/day per page

---

## 📊 Understanding Campaign Flow

### Normal Flow (Direct Send Mode)

1. **Start Campaign** → Status: `SENDING`
```
POST /api/campaigns/:id/send
  ↓
startCampaign(campaignId)
  ↓
getTargetContacts(campaignId)  // Filters for valid PSIDs
  ↓
Update campaign status to SENDING
  ↓
Queue messages (Redis or Direct)
  ↓
Send messages in background
  ↓
Update campaign status to COMPLETED
```

2. **Background Processing** (Async)
```
For each message:
  - Wait for rate limit delay
  - Send message to Facebook API
  - Create Message record (SENT or FAILED)
  - Update campaign counters
  ↓
All messages processed
  ↓
Update campaign to COMPLETED
```

### What Can Go Wrong

| Step | What Can Fail | Impact |
|------|--------------|---------|
| Get Target Contacts | No contacts with PSIDs | Campaign fails immediately |
| Filter PSIDs | Contacts without PSIDs excluded | Lower recipient count |
| Send Message | Facebook API error | Message marked FAILED |
| Update Status | Database error | Campaign stuck in SENDING |
| Background Processing | Crash/exception | Campaign stuck in SENDING |

---

## 🎯 Quick Checklist

Before creating a campaign:
- [ ] Contacts have been synced from Facebook
- [ ] Contacts have valid PSIDs (run diagnostic script)
- [ ] Facebook page token is valid
- [ ] At least one contact matches your targeting criteria
- [ ] Server/worker is running

After starting a campaign:
- [ ] Check terminal logs for progress
- [ ] Monitor campaign status in UI (refreshes every 3 seconds)
- [ ] Check for error messages in logs
- [ ] Verify messages appear in database

---

## 🐛 Advanced Debugging

### Enable Verbose Logging

The code now includes comprehensive logging. Watch your terminal for:

```
🚀 Starting campaign...
✅ Campaign found
📊 Target contacts found: X
📝 Updating campaign status...
📨 Using [queue/direct] send mode
📋 Prepared X messages
📤 Sending message 1/X...
✅ Message sent successfully
📊 Background sending completed
✅ Campaign marked as COMPLETED
```

### Check Message Records

```sql
-- See all messages for a campaign
SELECT 
  status,
  "errorMessage",
  content,
  "createdAt"
FROM "Message"
WHERE "campaignId" = 'your-campaign-id'
ORDER BY "createdAt" DESC;

-- Count by status
SELECT status, COUNT(*) as count
FROM "Message"
WHERE "campaignId" = 'your-campaign-id'
GROUP BY status;
```

### Monitor Campaign Metrics

```sql
-- Real-time campaign status
SELECT 
  name,
  status,
  "totalRecipients",
  "sentCount",
  "failedCount",
  "deliveredCount",
  "readCount",
  "startedAt",
  "completedAt"
FROM "Campaign"
WHERE id = 'your-campaign-id';
```

---

## 🚀 Performance Notes

### Rate Limiting
- Default: 100 messages/hour = 1 message every 36 seconds
- Adjust in database: `Campaign.rateLimit` field
- Facebook limits: ~1000-2000 messages/day per page

### Background Processing
- Uses `setImmediate()` for non-blocking execution
- Messages sent sequentially with delays
- Campaign marked COMPLETED automatically

### Redis vs Direct Mode
- **Redis Mode:** Better for large campaigns, requires worker
- **Direct Mode:** Simpler, works out-of-box, good for small campaigns
- System auto-detects which mode to use

---

## 📞 Still Having Issues?

If campaigns are still stuck after following this guide:

1. **Check the diagnostic output:**
   ```bash
   npx tsx scripts/check-contacts-psids.ts
   ```

2. **Review the logs carefully** - they contain detailed information

3. **Check these specific logs:**
   - `📊 Target contacts found: X` - should be > 0
   - `📋 Prepared X messages` - should match target contacts
   - `✅ Message sent successfully` - should appear for each message
   - `✅ Campaign marked as COMPLETED` - should appear at end

4. **Common mistakes:**
   - Expecting campaigns to complete instantly (they process in background)
   - Not syncing contacts before creating campaigns
   - Using expired Facebook tokens
   - Filtering that excludes all contacts

5. **Last resort:** Manually update campaign status in database

---

## ✅ Success Criteria

You'll know everything is working when:
- ✅ Diagnostic script shows contacts with valid PSIDs
- ✅ Campaign logs show messages being queued
- ✅ Background processing logs appear
- ✅ Messages appear in database with SENT status
- ✅ Campaign status changes to COMPLETED
- ✅ Sent count matches total recipients

**Remember:** Campaign sending happens in the background. Check your terminal/server logs to see progress!

