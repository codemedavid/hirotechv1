# Upstash Cloud Redis Setup (No Docker Required)

## Steps:

1. **Sign up for Upstash** (2 minutes):
   - Go to: https://upstash.com/
   - Click "Sign Up" (free tier available)
   - Verify your email

2. **Create a Redis Database** (1 minute):
   - Click "Create Database"
   - Choose a name: "hiro-campaigns"
   - Select region closest to you
   - Choose "Free" tier (10,000 commands/day)
   - Click "Create"

3. **Get Connection URL** (30 seconds):
   - Click on your database name
   - Find the "Redis Connect" section
   - Copy the full URL that looks like:
     ```
     redis://default:XXXXX@us1-magical-shark-12345.upstash.io:12345
     ```

4. **Update your .env.local file**:
   - Open `.env.local` in your project root
   - Find or add the REDIS_URL line:
     ```
     REDIS_URL=redis://default:YOUR_PASSWORD@your-endpoint.upstash.io:PORT
     ```
   - Save the file

5. **Restart your application**:
   - Stop your dev server (Ctrl+C)
   - Run: npm run dev
   - In another terminal: npm run worker

6. **Test**:
   - Go to Campaigns
   - Click "Start Campaign"
   - ✅ No more version errors!

## Upstash Advantages:
- ✅ Latest Redis version (7.x)
- ✅ No local installation needed
- ✅ Free tier (generous limits)
- ✅ Automatic backups
- ✅ Works from anywhere
- ✅ No Docker required

## Free Tier Limits:
- 10,000 commands per day
- 256 MB storage
- Perfect for development and small campaigns

