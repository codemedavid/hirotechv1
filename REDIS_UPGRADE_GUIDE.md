# Redis Upgrade Guide - Fix Version 3.0.504 Error

## Problem

You're encountering this error when starting campaigns:
```
Redis version needs to be greater or equal than 5.0.0
Current: 3.0.504
```

**Cause**: BullMQ (used for campaign message queuing) requires Redis 5.0.0+, but you have Redis 3.0.504 running.

---

## Solution Options for Windows

### ✅ Option 1: Docker (Recommended - Easiest)

**Requirements**: [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

**Steps**:

1. **Install Docker Desktop** (if not already installed)
   - Download: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop

2. **Stop your current Redis**:
   ```bash
   # Find and kill Redis process
   taskkill /F /IM redis-server.exe
   ```

3. **Start Redis 7 with Docker**:
   ```bash
   docker run -d --name redis-latest -p 6379:6379 redis:7-alpine
   ```

4. **Verify it's running**:
   ```bash
   docker ps
   # Should show redis container running
   
   docker exec redis-latest redis-cli INFO server | findstr redis_version
   # Should show redis_version:7.x.x
   ```

5. **Update your `.env` or `.env.local`**:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

6. **Restart your application**:
   ```bash
   npm run dev
   ```

7. **Start the worker**:
   ```bash
   npm run worker
   ```

**Docker Commands Reference**:
```bash
# Start Redis (if stopped)
docker start redis-latest

# Stop Redis
docker stop redis-latest

# View logs
docker logs redis-latest

# Remove container
docker rm -f redis-latest
```

---

### ✅ Option 2: WSL2 with Ubuntu + Redis

**Requirements**: Windows 10/11 with WSL2

**Steps**:

1. **Install WSL2** (if not already):
   ```powershell
   wsl --install
   ```

2. **Open Ubuntu terminal** and install Redis:
   ```bash
   sudo apt update
   sudo apt install redis-server -y
   ```

3. **Configure Redis to listen on Windows network**:
   ```bash
   sudo nano /etc/redis/redis.conf
   
   # Find and change:
   # bind 127.0.0.1 ::1
   # to:
   bind 0.0.0.0
   
   # Save and exit (Ctrl+X, Y, Enter)
   ```

4. **Start Redis**:
   ```bash
   sudo service redis-server start
   ```

5. **Check version**:
   ```bash
   redis-cli --version
   # Should show 5.x or higher
   ```

6. **Get your WSL IP**:
   ```bash
   ip addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'
   # Example output: 172.28.176.123
   ```

7. **Update `.env.local` in your Windows project**:
   ```env
   REDIS_URL=redis://172.28.176.123:6379
   ```
   *(Replace with your actual WSL IP)*

8. **Auto-start Redis on WSL boot** (optional):
   ```bash
   echo "sudo service redis-server start" >> ~/.bashrc
   ```

---

### ✅ Option 3: Memurai (Native Windows Redis)

**Note**: Memurai is a commercial product with a free developer edition.

**Steps**:

1. **Download Memurai**:
   - Visit: https://www.memurai.com/
   - Download free developer edition

2. **Install Memurai**:
   - Run installer
   - It will install as a Windows service

3. **Verify installation**:
   ```bash
   memurai-cli INFO server | findstr memurai_version
   # Should show version 4.x+ (Redis 7.x compatible)
   ```

4. **Update `.env.local`**:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

5. **Restart application**:
   ```bash
   npm run dev
   npm run worker
   ```

---

### ✅ Option 4: Cloud Redis (For Production)

Use a managed Redis service - no local installation needed.

#### **Upstash (Recommended - Free Tier)**

1. **Sign up**: https://upstash.com/
2. **Create Redis Database**:
   - Click "Create Database"
   - Choose region closest to you
   - Select "Free" tier
3. **Get Connection String**:
   - Click on your database
   - Copy "Redis URL" 
   - Format: `redis://default:password@host:port`
4. **Update `.env.local`**:
   ```env
   REDIS_URL=redis://default:YOUR_PASSWORD@your-endpoint.upstash.io:PORT
   ```

#### **Redis Cloud (Free Tier)**

1. **Sign up**: https://redis.io/try-free/
2. **Create Database**
3. **Get connection URL**
4. **Update `.env.local`**

---

## After Upgrading

### 1. Stop Old Redis

```bash
# Windows
taskkill /F /IM redis-server.exe

# Or find the process
tasklist | findstr redis
```

### 2. Verify New Redis Version

```bash
# Docker
docker exec redis-latest redis-cli INFO server | findstr redis_version

# WSL
redis-cli INFO server | grep redis_version

# Memurai
memurai-cli INFO server | findstr memurai_version
```

Expected output: `redis_version:5.0.0` or higher

### 3. Test Campaign System

1. Start your app:
   ```bash
   npm run dev
   ```

2. Start worker:
   ```bash
   npm run worker
   ```

3. Go to **Campaigns** in UI
4. Click **"Start Campaign"**
5. Should see: ✅ No version errors

---

## Troubleshooting

### Error: "Port 6379 already in use"

Old Redis is still running:
```bash
# Windows
taskkill /F /IM redis-server.exe

# Check what's using port
netstat -ano | findstr :6379
```

### Error: "ECONNREFUSED"

Redis isn't running:
```bash
# Docker
docker start redis-latest

# WSL
sudo service redis-server start
```

### Error: "Redis connection timeout"

Check firewall/WSL IP:
```bash
# Test connection
redis-cli -h YOUR_IP -p 6379 ping
# Should return: PONG
```

---

## Recommended Setup

For **development** (easiest):
```bash
# Use Docker
docker run -d --name redis-latest -p 6379:6379 redis:7-alpine
```

For **production**:
```env
# Use Upstash (free tier)
REDIS_URL=redis://default:password@your-endpoint.upstash.io:port
```

---

## What About the Old redis-server Folder?

You can safely **delete** the `redis-server\` folder in your project root. It contains an outdated and incompatible version of Redis that won't work with BullMQ.

```bash
# Optional: Remove old Redis folder
rmdir /s redis-server
```

---

## Need Help?

If you encounter issues:

1. **Check Redis is running**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check Redis version**:
   ```bash
   redis-cli INFO server | grep redis_version
   # Must be 5.0.0 or higher
   ```

3. **Check REDIS_URL in .env**:
   ```bash
   # PowerShell
   cat .env.local | findstr REDIS_URL
   ```

4. **Check logs**:
   - Application logs when starting campaign
   - Worker logs: `npm run worker`
   - Docker logs: `docker logs redis-latest`

---

## Summary

| Method | Difficulty | Best For | Version |
|--------|-----------|----------|---------|
| 🐳 Docker | ⭐ Easy | Development | 7.x |
| 🐧 WSL2 | ⭐⭐ Medium | Development | 6.x+ |
| 💾 Memurai | ⭐⭐ Medium | Development | 7.x compatible |
| ☁️ Cloud | ⭐ Easy | Production | Latest |

**Recommendation**: Use **Docker** for quickest setup, or **Upstash** if you don't want to run Redis locally.

