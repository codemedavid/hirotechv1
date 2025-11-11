# Quick Start: Campaign System

**Current Status**: ✅ Fixed - No more ECONNREFUSED errors

---

## What Was Wrong

Your console was flooded with Redis connection errors:
```
AggregateError: 
    at ignore-listed frames {
  code: 'ECONNREFUSED'
}
```

**Why?** The campaign system tried to connect to Redis immediately when loading, but Redis wasn't running.

---

## What's Fixed

✅ No more errors on page load  
✅ Redis only connects when actually sending campaigns  
✅ Clear error messages if Redis is missing  
✅ Application works normally without Redis (campaigns just won't send)

---

## To Use Campaigns (3 Steps)

### Step 1: Install Redis

**Easiest: Docker**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

**Or: Homebrew (Mac)**
```bash
brew install redis
brew services start redis
```

**Or: Cloud (Production)**
- Sign up for [Upstash](https://upstash.com/) (free tier available)
- Get your Redis URL

### Step 2: Add Environment Variable

Create/edit `.env.local`:
```bash
REDIS_URL=redis://localhost:6379

# Or for Upstash:
# REDIS_URL=redis://:password@your-upstash-url:6379
```

### Step 3: Start Worker

**Terminal 1** (if not already running):
```bash
npm run dev
```

**Terminal 2** (new terminal):
```bash
npm run worker
```

That's it! Now you can send campaigns.

---

## Test It

1. Go to **Campaigns** in your app
2. Create a new campaign
3. Click **"Start Campaign"**
4. Watch the worker terminal for processing logs
5. See real-time progress in the campaign details page

---

## Don't Want Redis Yet?

**The app works fine without it!** You just can't send campaigns until Redis is set up. 

Everything else works:
- ✅ Creating campaigns
- ✅ Viewing campaigns
- ✅ Editing campaigns
- ✅ All other features

When you try to send a campaign without Redis, you'll get a friendly error message telling you what to do.

---

## Scripts

Add to your `package.json` (if not already there):

```json
{
  "scripts": {
    "dev": "next dev",
    "worker": "tsx scripts/start-worker.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run worker\""
  }
}
```

Then you can use:
- `npm run dev` - Start Next.js only
- `npm run worker` - Start campaign worker only
- `npm run dev:all` - Start both together

---

## Troubleshooting

### "REDIS_URL environment variable is not set"
→ Add `REDIS_URL=redis://localhost:6379` to `.env.local`

### "connect ECONNREFUSED"
→ Start Redis: `docker start redis` or `brew services start redis`

### Worker not processing
→ Make sure you're running `npm run worker`

### Still seeing ECONNREFUSED?
→ Restart your dev server: `Ctrl+C` then `npm run dev` again

---

## Production Deployment

### Vercel + Upstash (Recommended)

1. **Deploy app to Vercel**
   ```bash
   vercel deploy
   ```

2. **Set up Upstash Redis**
   - Create account at [upstash.com](https://upstash.com)
   - Create Redis database
   - Copy Redis URL

3. **Add to Vercel environment**
   ```bash
   vercel env add REDIS_URL
   # Paste your Upstash Redis URL
   ```

4. **Deploy worker separately** (Railway, Render, Fly.io)
   - Push your code to GitHub
   - Create new service on Railway/Render
   - Add `REDIS_URL` environment variable
   - Set start command: `npm run worker`

---

## More Information

- Full setup guide: `CAMPAIGN_REDIS_SETUP.md`
- Technical analysis: `CAMPAIGN_ANALYSIS_REPORT.md`
- Original features: `CAMPAIGN_IMPLEMENTATION_SUMMARY.md`

---

**Questions?** Check the detailed guides above or open an issue.

