# 🚨 QUICK FIX: Redis Version Error

## The Error You're Seeing

```
Redis version needs to be greater or equal than 5.0.0
Current: 3.0.504
```

## Why This Happens

When you click **"Start Campaign"**, the system tries to use BullMQ (message queue) which requires Redis 5.0.0+. You currently have Redis 3.0.504 running (from the old `redis-server\` folder).

---

## ⚡ FASTEST FIX (2 Minutes)

### Prerequisites
- Docker Desktop installed and running
- If not: Download from https://www.docker.com/products/docker-desktop/

### Steps

1. **Run the upgrade script**:
   ```bash
   upgrade-redis.bat
   ```
   
   This will:
   - Stop old Redis 3.0.504
   - Start Redis 7.x in Docker
   - Verify it's working

2. **Check your `.env.local` file has**:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

3. **Restart your app**:
   ```bash
   npm run dev
   ```

4. **Start the worker** (in a new terminal):
   ```bash
   npm run worker
   ```

5. **Test it**:
   - Go to Campaigns
   - Click "Start Campaign"
   - ✅ No more version error!

---

## 🔧 Manual Docker Setup (If Script Fails)

```bash
# 1. Stop old Redis
taskkill /F /IM redis-server.exe

# 2. Remove old container (if exists)
docker rm -f redis-latest

# 3. Start new Redis
docker run -d --name redis-latest -p 6379:6379 redis:7-alpine

# 4. Verify version
docker exec redis-latest redis-cli INFO server | findstr redis_version
```

Should output: `redis_version:7.x.x`

---

## 🆘 Don't Have Docker?

### Option 1: Use Cloud Redis (No Installation)

**Upstash** (Free tier, 2 minutes to setup):

1. Go to https://upstash.com/
2. Sign up (free)
3. Create a database
4. Copy the Redis URL
5. Update `.env.local`:
   ```env
   REDIS_URL=redis://default:PASSWORD@your-endpoint.upstash.io:PORT
   ```
6. Restart: `npm run dev` and `npm run worker`

### Option 2: Use WSL2 (Windows Subsystem for Linux)

See detailed instructions in `REDIS_UPGRADE_GUIDE.md`

---

## ✅ How to Know It's Fixed

When you run `npm run worker`, you should see:
```
✅ Message worker started and connected to Redis at localhost:6379
```

NOT:
```
❌ Redis version needs to be greater or equal than 5.0.0
```

---

## 📊 Redis Management

### Start/Stop Redis Docker Container

```bash
# Start
docker start redis-latest

# Stop
docker stop redis-latest

# Check if running
docker ps

# View logs
docker logs redis-latest

# Restart
docker restart redis-latest
```

### Check Redis Connection

```bash
# Test connection
docker exec redis-latest redis-cli ping
# Should return: PONG
```

---

## 🗑️ Delete Old Redis Folder

Once the new Redis is working, you can delete the old one:

```bash
# Optional: Remove the outdated redis-server folder
rmdir /s redis-server
```

The `redis-server\` folder contains Redis 3.0.504 which is:
- 9 years old (2016)
- Incompatible with BullMQ
- No longer needed

---

## 🎯 Summary

| Step | Command | Expected Result |
|------|---------|-----------------|
| 1. Upgrade | `upgrade-redis.bat` | Redis 7.x running |
| 2. Verify | `docker exec redis-latest redis-cli INFO server` | Shows version 7.x |
| 3. Start App | `npm run dev` | App starts normally |
| 4. Start Worker | `npm run worker` | No version errors |
| 5. Test | Click "Start Campaign" | Campaign sends! ✅ |

---

## 🔗 Related Docs

- Full upgrade guide: `REDIS_UPGRADE_GUIDE.md`
- Campaign system docs: `QUICK_START_CAMPAIGNS.md`
- Redis setup: `CAMPAIGN_REDIS_SETUP.md`

---

## Still Having Issues?

Check these:

1. **Docker Desktop is running**
   - Look for Docker icon in system tray
   - Should not say "Starting..."

2. **Port 6379 is free**
   ```bash
   netstat -ano | findstr :6379
   ```
   If something's using it, stop it first

3. **REDIS_URL is correct**
   ```bash
   # PowerShell
   cat .env.local | findstr REDIS_URL
   ```
   Should be: `redis://localhost:6379`

4. **Redis is actually running**
   ```bash
   docker ps
   ```
   Should show `redis-latest` in the list

---

**TL;DR**: Run `upgrade-redis.bat` → Restart app → Start worker → Test campaigns ✅

