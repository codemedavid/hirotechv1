# Environment Variables Setup Guide

## 🚨 FACEBOOK OAUTH REDIRECT FIX

The Facebook OAuth redirect issue occurs because the `NEXT_PUBLIC_APP_URL` environment variable is not properly configured. Follow these steps to fix it:

### Step 1: Create Your `.env` File

Create a `.env` or `.env.local` file in your project root with the following content:

```env
# App Configuration
# IMPORTANT: This is your public app URL. Facebook OAuth redirects to: {NEXT_PUBLIC_APP_URL}/api/facebook/callback
# For production: Use your actual domain (e.g., https://yourapp.com)
# For local testing: Use http://localhost:3000 or your ngrok URL
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database_name

# NextAuth Configuration
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-nextauth-secret-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Facebook App Configuration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token

# Redis Configuration (for campaign processing)
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=production
```

### Step 2: Configure Your Facebook App

1. Go to [Facebook Developers Console](https://developers.facebook.com/apps/)
2. Select your app
3. Go to **Facebook Login** → **Settings**
4. Add your **OAuth Redirect URIs**:
   - For production: `https://your-production-domain.com/api/facebook/callback`
   - For local testing: `http://localhost:3000/api/facebook/callback`
   - If using ngrok: `https://your-ngrok-url.ngrok.io/api/facebook/callback`

### Step 3: Verify Configuration

You can test your configuration by visiting:
- `/api/debug/facebook-config` - Shows your current Facebook configuration
- `/api/test-env` - Shows which environment variables are set

### Common Issues

#### Issue 1: Still Redirecting to Localhost
**Problem:** `NEXT_PUBLIC_APP_URL` is set to localhost or not set at all.

**Solution:** 
- Check your `.env` file exists in the project root
- Ensure `NEXT_PUBLIC_APP_URL` is set to your production URL
- Restart your development server after changing environment variables
- For Vercel deployment, set environment variables in the Vercel dashboard

#### Issue 2: Redirect URI Mismatch Error from Facebook
**Problem:** The redirect URI doesn't match what's configured in Facebook.

**Solution:**
- Ensure the URL in Facebook App Settings exactly matches: `{NEXT_PUBLIC_APP_URL}/api/facebook/callback`
- No trailing slashes
- Protocol must match (http vs https)

#### Issue 3: Environment Variables Not Loading
**Problem:** Changes to `.env` file are not reflected.

**Solution:**
- Restart your Next.js development server
- For production builds, rebuild your application
- For Vercel: Redeploy after adding environment variables

### For Local Development with Facebook OAuth

Facebook OAuth requires a public URL (not localhost). You have two options:

#### Option 1: Use ngrok (Recommended for Testing)
```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose it
ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Update your .env:
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# Add the callback URL to Facebook App:
# https://abc123.ngrok.io/api/facebook/callback
```

#### Option 2: Use Test Mode
Configure Facebook App in Development Mode to accept localhost URLs (limited functionality).

### For Production Deployment

1. Set environment variables in your hosting platform:
   - **Vercel:** Project Settings → Environment Variables
   - **Railway:** Variables tab
   - **Heroku:** Config Vars

2. Ensure `NEXT_PUBLIC_APP_URL` is set to your production domain

3. Add the production callback URL to Facebook App Settings

### Debugging

Enable debug mode by checking the console logs in:
- `/api/facebook/oauth` - Shows the generated OAuth URL
- `/api/facebook/callback` - Shows the callback processing

The logs will display:
- Current `NEXT_PUBLIC_APP_URL` value
- Generated redirect URI
- OAuth URL being used

---

## Need Help?

If you're still experiencing issues:
1. Check the console logs when clicking "Connect Facebook"
2. Verify your `.env` file is in the project root
3. Ensure no typos in environment variable names
4. Restart your server after any changes

