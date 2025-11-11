# .env.local Redis URL Fix

## Problem

Your `.env.local` has an incomplete Redis URL:
```
❌ REDIS_URL=redis-14778.c326.us-east-1-3.ec2.redns.redis-cloud.com:14778
```

Missing:
- `redis://` protocol prefix
- Password for authentication

## Solution

Open `.env.local` and replace the REDIS_URL line with:

```bash
REDIS_URL=redis://:YOUR_PASSWORD@redis-14778.c326.us-east-1-3.ec2.redns.redis-cloud.com:14778
```

Replace `YOUR_PASSWORD` with your actual Redis Cloud password.

## How to Get Your Password

1. Go to https://app.redislabs.com/
2. Find database: `redis-14778`
3. Click "Configuration" tab
4. Copy the password or full connection URL

## Final Format

Your `.env.local` should look like:
```bash
# Redis Cloud (for local development)
REDIS_URL=redis://:abc123xyz456@redis-14778.c326.us-east-1-3.ec2.redns.redis-cloud.com:14778
```

Note the `:` before the password and `@` after it!

## After Fix

1. Save `.env.local`
2. Restart dev server: `npm run dev`
3. Try starting a campaign - should work!

