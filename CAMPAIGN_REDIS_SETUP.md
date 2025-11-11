# Campaign & Messaging System - Redis Setup Guide

## Overview

The campaign and messaging system uses **BullMQ** (a Redis-based job queue) to handle bulk message sending. This ensures:
- **Rate limiting**: Messages are sent at a controlled rate
- **Reliability**: Failed messages can be retried automatically
- **Scalability**: Multiple workers can process messages in parallel
- **Monitoring**: Job status and progress can be tracked

## Architecture

```
┌─────────────────┐
│  Next.js App    │
│  (API Routes)   │
└────────┬────────┘
         │
         │ Queues jobs
         ▼
┌─────────────────┐
│     Redis       │ ◄──────┐
│  (Job Queue)    │        │
└────────┬────────┘        │
         │                 │
         │ Polls for jobs  │
         ▼                 │
┌─────────────────┐        │
│  Worker Process │────────┘
│  (send messages)│   Updates status
└─────────────────┘
```

## Problem Fixed

### Before (ECONNREFUSED Errors)
The system was attempting to connect to Redis **immediately** when modules were imported, causing:
- Console flooded with `ECONNREFUSED` errors
- Application startup delays
- Failed campaign sends

### After (Lazy Initialization)
- Redis connections are only established when actually needed
- Worker runs as a separate, optional process
- Graceful error messages if Redis is not configured
- Application works without Redis (campaigns won't send, but won't crash)

## Setup Instructions

### 1. Install Redis

#### Option A: Local Installation (Development)

**macOS (via Homebrew)**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Windows**
- Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
- Or use WSL2 and follow Linux instructions
- Or use Docker (see Option B)

#### Option B: Docker (Recommended for all platforms)

```bash
# Run Redis in Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:alpine

# Verify it's running
docker ps
```

#### Option C: Cloud Redis (Production)

For production, use a managed Redis service:
- **Upstash Redis** (recommended): https://upstash.com/
- **Redis Cloud**: https://redis.com/cloud/
- **AWS ElastiCache**: https://aws.amazon.com/elasticache/
- **Azure Cache for Redis**: https://azure.microsoft.com/services/cache/

### 2. Configure Environment Variables

Add to your `.env` or `.env.local`:

```bash
# Local Redis (Development)
REDIS_URL=redis://localhost:6379

# Or Cloud Redis (Production)
# REDIS_URL=redis://username:password@your-redis-host:6379
```

**For Upstash Redis:**
```bash
REDIS_URL=redis://:YOUR_UPSTASH_PASSWORD@YOUR_UPSTASH_HOST:6379
```

### 3. Start the Worker Process

The worker must be running to process campaign messages.

#### Development

Add this script to your `package.json`:
```json
{
  "scripts": {
    "worker": "tsx scripts/start-worker.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run worker\""
  }
}
```

Then run:
```bash
# Start worker separately
npm run worker

# Or start both Next.js and worker together
npm run dev:all
```

#### Production

For production, you need to run the worker as a separate process:

**Option 1: Using PM2**
```bash
npm install -g pm2

# Start Next.js
pm2 start npm --name "nextjs-app" -- start

# Start worker
pm2 start npm --name "campaign-worker" -- run worker

# Save configuration
pm2 save
pm2 startup
```

**Option 2: Using Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
  
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  worker:
    build: .
    command: npm run worker
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
```

**Option 3: Vercel + Upstash**
- Deploy your Next.js app to Vercel
- Use Upstash Redis (serverless)
- Run worker on a separate service (Railway, Render, Fly.io)
- Set REDIS_URL in both environments

### 4. Verify Setup

#### Check Redis Connection
```bash
# Test Redis
redis-cli ping
# Should return: PONG
```

#### Test Campaign Send
1. Create a campaign in the UI
2. Click "Start Campaign"
3. Check the worker console for job processing logs
4. Check the campaign details page for real-time progress

## Troubleshooting

### Error: `REDIS_URL environment variable is not set`
**Solution**: Add `REDIS_URL` to your `.env` file

### Error: `Redis connection failed: connect ECONNREFUSED`
**Solution**: Make sure Redis is running
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
# macOS: brew services start redis
# Linux: sudo systemctl start redis
# Docker: docker start redis
```

### Worker not processing jobs
**Solution**: Make sure worker process is running
```bash
npm run worker
```

### Jobs stuck in queue
**Solution**: Restart the worker
```bash
# Stop worker (Ctrl+C)
# Then start again
npm run worker
```

## Monitoring

### View Queue Status

Create an admin endpoint to monitor queues:

```typescript
// src/app/api/admin/queue-status/route.ts
import { NextResponse } from 'next/server';
import { Queue } from 'bullmq';

export async function GET() {
  const queue = new Queue('messages', {
    connection: {
      host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0],
      port: parseInt(process.env.REDIS_URL?.split(':').pop() || '6379'),
    },
  });

  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);

  return NextResponse.json({
    waiting,
    active,
    completed,
    failed,
  });
}
```

### Use BullMQ Board (UI Dashboard)

```bash
npm install @bull-board/express @bull-board/api
```

Then set up a dashboard route to visualize your queues.

## Development Workflow

1. **Start Redis** (if using local/Docker)
   ```bash
   docker start redis  # or brew services start redis
   ```

2. **Start Next.js dev server**
   ```bash
   npm run dev
   ```

3. **Start worker** (in a separate terminal)
   ```bash
   npm run worker
   ```

4. **Test campaigns**
   - Create campaign
   - Start campaign
   - Watch worker logs for processing
   - Check campaign metrics in UI

## Production Checklist

- [ ] Redis instance is provisioned and running
- [ ] `REDIS_URL` is set in environment variables
- [ ] Worker process is running and monitored
- [ ] Worker auto-restarts on failure (PM2, Docker, etc.)
- [ ] Redis has sufficient memory for job queue
- [ ] Redis persistence is enabled (for reliability)
- [ ] Monitoring/alerting is set up for worker health
- [ ] Rate limits are configured appropriately

## Optional: Run Without Redis

If you want to test campaigns without setting up Redis, you can modify `src/lib/campaigns/send.ts` to send messages synchronously instead of queuing them. However, this is **not recommended** for production as it:
- Blocks the API request
- Doesn't provide rate limiting
- Can't retry failed messages
- Won't scale well

## Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/docs/)
- [Upstash Documentation](https://docs.upstash.com/redis)
- [PM2 Documentation](https://pm2.keymetrics.io/)

