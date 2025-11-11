# Facebook OAuth Redirect URI Error - Fix

## ❌ Error Message

```
This redirect failed because the redirect URI is not whitelisted in the app's 
Client OAuth Settings. Make sure Client and Web OAuth Login are on and add all 
your app domains as Valid OAuth Redirect URIs.
```

## 🔍 What This Means

Facebook is rejecting the OAuth callback because the URL isn't configured in your Facebook App settings.

## ✅ Step-by-Step Fix

### Step 1: Find Your Exact Callback URLs

Visit this URL in your browser to see the exact URLs you need to add:

```
http://localhost:3000/api/debug/oauth-urls
```

Or if deployed:
```
https://your-domain.com/api/debug/oauth-urls
```

This will show you the **exact** URLs to copy.

### Step 2: Add URLs to Facebook App

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/apps/

2. **Select Your App**
   - Click on your app from the list

3. **Navigate to Facebook Login Settings**
   - In the left sidebar, click **"Facebook Login"**
   - Click **"Settings"** under it

4. **Enable Required Settings**
   - Make sure **"Client OAuth Login"** is toggled **ON**
   - Make sure **"Web OAuth Login"** is toggled **ON**

5. **Add Valid OAuth Redirect URIs**
   - Scroll to **"Valid OAuth Redirect URIs"**
   - Add BOTH of these URLs (one per line):
     ```
     https://your-domain.com/api/facebook/callback
     https://your-domain.com/api/facebook/callback-popup
     ```
   
   **Important:**
   - Replace `your-domain.com` with your actual domain
   - Copy from `/api/debug/oauth-urls` to ensure they're exact
   - No trailing slashes!
   - Must be https:// (not http://) unless localhost
   - Both URLs are required

6. **Save Changes**
   - Scroll to the bottom
   - Click **"Save Changes"**
   - Wait 10-30 seconds for changes to propagate

### Step 3: Verify Your .env Configuration

Make sure your `.env` file has:

```env
NEXT_PUBLIC_APP_URL=https://your-actual-domain.com
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
```

**Important:**
- `NEXT_PUBLIC_APP_URL` should be your production URL or ngrok URL
- NO localhost unless testing (Facebook may reject localhost)
- NO trailing slash

### Step 4: Test Again

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Try connecting Facebook again

## 🖼️ Visual Guide

Here's what you're looking for in Facebook App Settings:

```
┌─────────────────────────────────────────────────┐
│ Facebook Login Settings                         │
├─────────────────────────────────────────────────┤
│                                                 │
│ Client OAuth Login:  [ON] ← Must be ON         │
│                                                 │
│ Web OAuth Login:     [ON] ← Must be ON         │
│                                                 │
│ Valid OAuth Redirect URIs:                      │
│ ┌─────────────────────────────────────────────┐ │
│ │ https://your-domain.com/api/facebook/callback│ │
│ │ https://your-domain.com/api/facebook/callback│ │
│ │ -popup                                       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│                        [Save Changes] ← Click!  │
└─────────────────────────────────────────────────┘
```

## 🚨 Common Mistakes

### ❌ Wrong:
```
https://your-domain.com/api/facebook/callback/
                                              ^ NO trailing slash!
```

### ❌ Wrong:
```
http://your-domain.com/api/facebook/callback
^^^^ Must be https:// not http:// (unless localhost)
```

### ❌ Wrong:
```
https://your-domain.com/api/facebook/callback
(only added one URL, need BOTH callback and callback-popup)
```

### ✅ Correct:
```
https://your-domain.com/api/facebook/callback
https://your-domain.com/api/facebook/callback-popup
```

## 🔧 For Local Development

If you're testing locally, you need to use ngrok because Facebook requires a public URL:

### 1. Install and Run ngrok
```bash
# Install ngrok
npm install -g ngrok

# In one terminal, start your app
npm run dev

# In another terminal, expose it
ngrok http 3000
```

### 2. Copy the ngrok URL
```
ngrok will show something like:
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
                    ^^^^^^^^^^^^^^^^
                    Use this URL
```

### 3. Update Your .env
```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

### 4. Add to Facebook
```
https://abc123.ngrok.io/api/facebook/callback
https://abc123.ngrok.io/api/facebook/callback-popup
```

### 5. Restart Server
```bash
npm run dev
```

**Note:** ngrok URLs change every time you restart ngrok (free plan), so you'll need to update Facebook settings each time.

## 📋 Quick Checklist

Before testing, verify:

- [ ] Visited `/api/debug/oauth-urls` to get exact URLs
- [ ] Facebook App has "Client OAuth Login" enabled
- [ ] Facebook App has "Web OAuth Login" enabled
- [ ] Added BOTH callback URLs to "Valid OAuth Redirect URIs"
- [ ] URLs match exactly (no typos, no trailing slashes)
- [ ] Clicked "Save Changes" in Facebook
- [ ] Waited 30 seconds after saving
- [ ] `.env` has correct `NEXT_PUBLIC_APP_URL`
- [ ] Restarted development server

## 🎯 Direct Links

To make this easier:

1. **Check your URLs:**
   ```
   http://localhost:3000/api/debug/oauth-urls
   ```

2. **Facebook App Settings:**
   ```
   https://developers.facebook.com/apps/YOUR_APP_ID/fb-login/settings/
   ```
   (Replace YOUR_APP_ID with your actual app ID)

## ⚡ Quick Test

After setting up, test your configuration:

```bash
# Check environment
curl http://localhost:3000/api/test-env

# Check OAuth URLs
curl http://localhost:3000/api/debug/oauth-urls

# Check Facebook config
curl http://localhost:3000/api/debug/facebook-config
```

All should show your URLs correctly configured.

## 🆘 Still Not Working?

If you still get the redirect error:

1. **Double-check the URLs**
   - Copy from `/api/debug/oauth-urls`
   - Paste exactly into Facebook

2. **Check Facebook App Mode**
   - Is your app in "Development" or "Live" mode?
   - Development mode may have restrictions

3. **Verify App Domains**
   - Go to Facebook App Settings → Basic
   - Add your domain to "App Domains"

4. **Wait Longer**
   - Facebook changes can take up to 5 minutes to propagate
   - Try clearing browser cache

5. **Check Console Logs**
   - Look at server console when clicking "Connect Facebook"
   - Should show the OAuth URL being used

## 📝 Example Working Configuration

**Your `.env`:**
```env
NEXT_PUBLIC_APP_URL=https://myapp.vercel.app
FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=your-secret-here
```

**Facebook App Settings → Facebook Login → Settings:**
```
Valid OAuth Redirect URIs:
https://myapp.vercel.app/api/facebook/callback
https://myapp.vercel.app/api/facebook/callback-popup
```

**Result:** ✅ OAuth works perfectly!

## 🎉 After It Works

Once you see Facebook's login screen in the popup without errors, you're all set! The OAuth flow will:

1. Open popup with Facebook login
2. User authenticates
3. Popup closes automatically
4. Page selector appears
5. User selects Facebook pages to connect

---

**Need more help?** Check the console logs or visit `/api/debug/oauth-urls` to verify your configuration.

