# 🚀 Quick Start - Send Your First Campaign

## ✅ Everything is Ready!

All services are running:
- ✅ Redis Server (localhost:6379)
- ✅ Campaign Worker (processing jobs)
- ✅ Environment Configured (.env.local)

---

## 📨 Send Your First Campaign (3 Steps)

### Step 1: Create a Campaign

1. Open your app: **http://localhost:3000/campaigns**
2. Click **"New Campaign"** button
3. Fill in the form:
   ```
   Name: Test Campaign
   Description: My first campaign
   Platform: MESSENGER (or INSTAGRAM)
   Facebook Page: [Select your connected page]
   Message Template: [Select or create a template]
   Targeting: ALL_CONTACTS (or specific tags/groups)
   Rate Limit: 100 (messages per hour)
   Message Tag: ACCOUNT_UPDATE (if sending outside 24hr window)
   ```
4. Click **"Create Campaign"**

### Step 2: Start the Campaign

1. Click on your newly created campaign
2. Review the details
3. Click **"Start Campaign"** button
4. Confirm the action

### Step 3: Watch the Magic! ✨

The page will automatically update every 3 seconds showing:
- 📊 Progress bar filling up
- 📤 Sent count increasing
- ✅ Delivery status
- 📖 Read receipts

---

## 🎯 What Happens Behind the Scenes

```
User clicks "Start" → API queues messages → Redis stores jobs → Worker picks up jobs → Facebook API sends messages → Stats update
```

1. **Frontend** calls `/api/campaigns/{id}/send`
2. **API** queues messages in Redis (using BullMQ)
3. **Worker** picks up jobs from Redis
4. **Worker** sends via Facebook Graph API
5. **Database** updates with delivery status
6. **Frontend** polls and shows real-time progress

---

## 🔍 Monitor Your Campaign

### In the App:
- Go to **Campaigns** page
- Click on any campaign to see details
- Watch real-time stats update

### Stats You'll See:
- **Total Recipients** - How many contacts targeted
- **Sent** - Messages sent successfully
- **Delivered** - Confirmed deliveries by Facebook
- **Failed** - Messages that couldn't be sent
- **Read Rate** - % of delivered messages that were read
- **Delivery Rate** - % of sent messages that were delivered

---

## 🛠️ Service Status

### Check if Redis is Running:
```bash
redis-server/redis-cli.exe ping
# Should return: PONG
```

### Check Worker Status:
The worker is running in the background. If you need to see logs:
```bash
npm run worker
```

### Restart Services (if needed):
```bash
# In project root
redis-server/redis-server.exe &
npm run worker &
```

---

## 💡 Tips for Success

### 1. Test with Small Groups First
- Start with 5-10 contacts
- Verify messages are sending correctly
- Then scale up

### 2. Use Message Tags Correctly
- **No tag / RESPONSE**: Only works within 24 hours of user message
- **ACCOUNT_UPDATE**: For important account updates
- **POST_PURCHASE_UPDATE**: For order/shipping updates
- **CONFIRMED_EVENT_UPDATE**: For event reminders
- **HUMAN_AGENT**: For live agent responses

### 3. Set Appropriate Rate Limits
- Start with 100 messages/hour
- Facebook's limit is typically ~250-500 per day per page
- Adjust based on your page's message quota

### 4. Monitor Failed Messages
- Check failed count in campaign details
- Common reasons:
  - Invalid PSID/Instagram ID
  - 24-hour window expired (need message tag)
  - Page access token expired
  - User blocked the page

---

## 🚨 Troubleshooting

### Campaign Stuck at "Sending"
**Cause:** Worker not processing
**Fix:** 
```bash
npm run worker
```

### Messages Not Sending
**Check:**
1. ✅ Redis running? → `redis-server/redis-cli.exe ping`
2. ✅ Worker running? → `ps aux | grep node`
3. ✅ Valid contacts? → Check contacts have PSID/Instagram IDs
4. ✅ Valid page token? → Check Facebook Page integration

### "ECONNREFUSED" Error
**Cause:** Redis not running
**Fix:**
```bash
redis-server/redis-server.exe &
```

---

## 📱 Example Campaign

**Use Case:** Welcome message to all new contacts

```yaml
Name: Welcome Campaign
Description: Send welcome message to all contacts
Platform: MESSENGER
Targeting: ALL_CONTACTS
Message Template: 
  "Hi {firstName}! 👋
  
  Thanks for connecting with us! We're excited to have you here.
  
  If you have any questions, just reply to this message!"
Rate Limit: 100/hour
Message Tag: ACCOUNT_UPDATE
```

---

## ✅ Checklist Before Starting

- [ ] Redis is running (`redis-cli ping` returns PONG)
- [ ] Worker is running (`npm run worker`)
- [ ] Facebook Page is connected
- [ ] Contacts have valid PSIDs/Instagram IDs
- [ ] Message template is created
- [ ] Campaign targeting is configured
- [ ] Rate limit is set appropriately

---

## 🎉 You're All Set!

Go to: **http://localhost:3000/campaigns**

Create your first campaign and watch the messages fly! 🚀

---

**Questions?** Check `CAMPAIGN_WORKER_STATUS.md` for detailed setup info.

