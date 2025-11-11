# Quick Fix: Facebook OAuth Redirecting to Localhost

## ✅ FIXED! 

This issue has been resolved with two solutions:
1. **Fixed callback redirects** to use `NEXT_PUBLIC_APP_URL`
2. **Implemented popup-based OAuth** for better UX (recommended)

See `FACEBOOK_REDIRECT_COMPLETE_FIX.md` for full details.

## 🎯 The Problem

Your Facebook OAuth was redirecting to `localhost` instead of your configured URL because the `NEXT_PUBLIC_APP_URL` environment variable was either:
- Not set in your `.env` file
- Set to `localhost` 
- Not being read by your application

**This is now fixed!** The callback routes now use the configured URL.

## ✅ Immediate Fix

### 1. Create/Update Your `.env` File

In your project root (`C:\Users\bigcl\Downloads\hiro\`), create a file named `.env` (or `.env.local`) with this content:

```env
# Replace with your actual production domain or ngrok URL
NEXT_PUBLIC_APP_URL=https://your-actual-domain.com

# Your other environment variables
FACEBOOK_APP_ID=your-app-id-here
FACEBOOK_APP_SECRET=your-app-secret-here
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your-webhook-token
DATABASE_URL=your-database-url
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

**Important:** Replace `https://your-actual-domain.com` with:
- Your production URL (e.g., `https://yourapp.vercel.app`)
- OR your ngrok URL for local testing (e.g., `https://abc123.ngrok.io`)

### 2. Update Facebook App Settings

1. Go to https://developers.facebook.com/apps/
2. Select your app
3. Go to **Facebook Login** → **Settings**
4. In **Valid OAuth Redirect URIs**, add BOTH:
   ```
   https://your-actual-domain.com/api/facebook/callback
   https://your-actual-domain.com/api/facebook/callback-popup
   ```
   ⚠️ Must match EXACTLY with your `NEXT_PUBLIC_APP_URL`

### 3. Restart Your Application

```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm run dev
```

### 4. Test Your Configuration

Visit these URLs to verify:
- http://localhost:3000/api/debug/facebook-config
- http://localhost:3000/api/test-env

These will show you:
- ✅ Which environment variables are set
- ✅ The exact redirect URI being used
- ✅ What Facebook will receive

## 🔍 Verification Steps

1. Check the terminal logs when you click "Connect Facebook"
2. You should see:
   ```
   === FACEBOOK OAUTH DEBUG ===
   NEXT_PUBLIC_APP_URL: https://your-actual-domain.com ✅
   FACEBOOK_APP_ID: ✅ Set
   FACEBOOK_APP_SECRET: ✅ Set
   Redirect URI will be: https://your-actual-domain.com/api/facebook/callback
   ```

3. If you see `❌ NOT SET`, your `.env` file is not being loaded

## 🚨 Common Issues

### Issue 1: Still seeing localhost after creating .env
**Solution:** 
- Make sure the file is named exactly `.env` (no `.txt` extension)
- Restart your development server
- Check the file is in the project root, not in `src/`

### Issue 2: For Local Development
Facebook OAuth doesn't work with localhost. You need:

**Option A: Use ngrok (Recommended)**
```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In another terminal
ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Update NEXT_PUBLIC_APP_URL in .env to this URL
# Add this URL to Facebook App Settings
```

**Option B: Deploy to Vercel**
```bash
vercel
# Use the deployed URL as NEXT_PUBLIC_APP_URL
# Add it to Facebook App Settings
```

### Issue 3: For Production (Vercel)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_APP_URL` with your production URL
3. Redeploy your application
4. Add the production URL to Facebook App Settings

## 📝 How It Works

The redirect URI is constructed in `src/lib/facebook/auth.ts`:

```typescript
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/facebook/callback`;
```

When you click "Connect Facebook":
1. App reads `NEXT_PUBLIC_APP_URL` from environment
2. Constructs redirect URI: `{NEXT_PUBLIC_APP_URL}/api/facebook/callback`
3. Redirects to Facebook with this URI
4. Facebook redirects back to this URI after authentication

If `NEXT_PUBLIC_APP_URL` is not set → redirects to `undefined/api/facebook/callback`
If `NEXT_PUBLIC_APP_URL` is `localhost` → redirects to `localhost/api/facebook/callback`

## 🎯 What You Need Right Now

1. **Create `.env` file** with `NEXT_PUBLIC_APP_URL` set to your production URL
2. **Add callback URL** to Facebook App Settings
3. **Restart** your development server
4. **Test** by clicking "Connect Facebook"

Need more help? Check `ENV_SETUP_GUIDE.md` for detailed configuration instructions.

