# Install Docker Desktop + Redis 7

## Steps:

1. **Download Docker Desktop** (5 minutes):
   - Go to: https://www.docker.com/products/docker-desktop/
   - Click "Download for Windows"
   - Run the installer
   - Restart your computer if prompted

2. **Start Docker Desktop** (2 minutes):
   - Open Docker Desktop from Start menu
   - Wait for it to say "Docker Desktop is running"
   - Check system tray for Docker whale icon

3. **Run the upgrade script**:
   - Open terminal in your project folder
   - Run: upgrade-redis.bat
   - This will:
     - Stop old Redis 3.0.504
     - Start Redis 7.x in Docker
     - Verify version

4. **Restart your application**:
   - npm run dev
   - npm run worker

5. **Test campaigns** - no more version errors!

## Docker Advantages:
- ✅ Latest Redis version (7.x)
- ✅ Easy to manage (start/stop)
- ✅ No cloud dependency
- ✅ Works offline
- ✅ Free forever

## Docker Commands:
```bash
# Start Redis
docker start redis-latest

# Stop Redis  
docker stop redis-latest

# Check if running
docker ps

# View logs
docker logs redis-latest
```

