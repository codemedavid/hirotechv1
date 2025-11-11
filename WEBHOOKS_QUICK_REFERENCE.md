# Webhooks vs Graph API - Quick Reference Card

## 🎯 When to Use What

### Use Webhooks For (Real-time) ⚡

- ✅ New incoming messages
- ✅ Delivery & read receipts  
- ✅ Auto-creating contacts when users message you
- ✅ Real-time conversation updates
- ✅ Message status tracking

**API Calls:** 0-1 per event (only 1 if new contact)
**Latency:** < 1 second
**Frequency:** Continuous (event-driven)

### Use Graph API For (Backfill & Refresh) 🔄

- ✅ Initial page connection sync
- ✅ Historical conversations backfill
- ✅ Profile information updates
- ✅ Manual "Sync" button
- ✅ Recovering from missed webhooks
- ✅ Daily profile refresh

**API Calls:** N calls (N = number of contacts)
**Latency:** Variable (seconds to minutes)
**Frequency:** On-demand + daily

---

## 📊 Quick Comparison

| Feature | Webhooks | Graph API |
|---------|----------|-----------|
| Speed | ⚡ Instant | 🐌 Manual/Polling |
| API Calls | 💚 ~0 | 💛 Many |
| Historical | ❌ No | ✅ Yes |
| Real-time | ✅ Yes | ❌ No |
| Setup | 🔧 Complex | ✅ Simple |
| Best For | **Ongoing** | **Initial + Refresh** |

---

## 🏗️ Architecture

```
New Message Flow (Webhooks):
User → Facebook → Webhook → Your DB (< 1 sec)

Initial Sync Flow (Graph API):
Click "Sync" → Graph API → Fetch All → Your DB (10-60 sec)

Optimal Strategy:
Graph API (initial) + Webhooks (ongoing) + Graph API (daily refresh)
```

---

## ✅ What You Have Now

### Webhooks Implemented ✅
- `/api/webhooks/facebook` endpoint
- Auto-contact creation for Messenger
- Auto-contact creation for Instagram
- Message handling
- Delivery/read receipts
- Webhook event logging

### Graph API Implemented ✅
- `/api/facebook/sync` endpoint
- Initial contact sync
- Profile enrichment
- Messenger & Instagram support
- Error handling & retry logic
- Manual sync button in UI

### Best Practice: Hybrid ✅
- Webhooks as primary (90% of operations)
- Graph API as backup (10% of operations)
- Auto-sync every 24 hours
- Manual sync on-demand

---

## 🚀 Quick Decision Tree

```
Is this a NEW event happening NOW?
│
├─ YES → Use Webhooks (automatic)
│         Examples: New message, delivery receipt, read receipt
│
└─ NO  → Use Graph API (manual trigger)
          Examples: Initial sync, profile updates, backfill
```

---

## 💡 Common Scenarios

### Scenario 1: User Messages You for First Time
**Method:** Webhook (automatic)
- Webhook fires instantly
- Auto-creates contact with profile
- Saves message
- **API Calls:** 1 (profile only)

### Scenario 2: Existing User Messages You
**Method:** Webhook (automatic)
- Webhook fires instantly
- Finds existing contact
- Saves message
- **API Calls:** 0

### Scenario 3: Just Connected New Facebook Page
**Method:** Graph API (manual button)
- Click "Sync" button
- Fetches all conversations
- Creates all contacts with profiles
- **API Calls:** Many (1 + N contacts)

### Scenario 4: Want to Update All Contact Profiles
**Method:** Graph API (manual or scheduled)
- Runs daily at 2 AM (or on-demand)
- Updates all contact information
- Catches any missed webhook events
- **API Calls:** Many (N contacts)

---

## 🔍 Debugging

### Webhooks Not Working?
```bash
# Check webhook verification
curl "https://yourdomain.com/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"

# Should return: test

# Check webhook logs in database
SELECT * FROM "WebhookEvent" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### Graph API Not Working?
```bash
# Test access token
curl "https://graph.facebook.com/v19.0/me?access_token=YOUR_TOKEN"

# Should return page information

# Check sync errors in browser console when clicking Sync button
```

---

## 📈 Performance

### 1000 Messages/Day Example:

**Webhooks Only:**
- API Calls: ~100 (new contacts only)
- Latency: < 1 sec
- ❌ Problem: No historical data

**Graph API Only (1 min polling):**
- API Calls: 1,440 (every minute)
- Latency: Up to 60 sec
- ❌ Problem: High API usage

**Hybrid (Your Setup) ✅:**
- API Calls: ~100 (webhooks) + 50 (daily sync) = 150 total
- Latency: < 1 sec for new messages
- ✅ Best of both worlds!

---

## 🎓 Bottom Line

**Question:** "Use webhooks instead for fetching data?"

**Answer:** Use **BOTH**:
- Webhooks = Real-time magic ⚡
- Graph API = Historical backbone 🏗️

**Your Implementation:** PERFECT! ✅

You have both working together in the optimal configuration. Webhooks handle 90% of operations in real-time, Graph API handles initial sync and keeps profiles fresh.

---

## 📚 More Details

See `WEBHOOKS_VS_GRAPH_API_STRATEGY.md` for comprehensive guide.

