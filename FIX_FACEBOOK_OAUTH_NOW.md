# 🚨 FIX FACEBOOK OAUTH ERROR NOW

## 🎯 The Problem
Facebook is showing **"URL Blocked"** error because your redirect URI is not whitelisted.

---

## ⚡ Quick Fix (5 Minutes)

### 1️⃣ Update `.env.local` File

**Location:** Project root (`C:\Users\bigcl\Downloads\hiro\.env.local`)

**Add or update this line:**
```env
NEXT_PUBLIC_APP_URL=https://your-actual-domain.com
```

**Replace with:**
- **Production:** `https://yourapp.vercel.app`
- **Local testing:** Your ngrok URL `https://abc123.ngrok-free.app`

**⚠️ Rules:**
- ✅ Must be HTTPS (not HTTP)
- ✅ No trailing slash
- ❌ NOT `localhost` (Facebook rejects it)

---

### 2️⃣ Configure Facebook App

**Go to:** https://developers.facebook.com/apps/

**Steps:**

1. **Select your app** from the list

2. **Click:** `Facebook Login` → `Settings` (left sidebar)

3. **Enable these:**
   ```
   ✅ Client OAuth Login → ON
   ✅ Web OAuth Login → ON
   ```

4. **Scroll to "Valid OAuth Redirect URIs"**

5. **Add BOTH these URLs** (replace `your-domain.com`):
   ```
   https://your-domain.com/api/facebook/callback
   https://your-domain.com/api/facebook/callback-popup
   ```

6. **Click "Save Changes"** (bottom of page)

7. **Wait 30 seconds** for changes to apply

---

### 3️⃣ Restart Everything

**Terminal:**
```bash
# Stop server (Ctrl+C)
npm run dev

# If using ngrok:
ngrok http 3000
```

---

### 4️⃣ Clear Browser Cookies

**Quick Method:**
1. Press `F12` (DevTools)
2. Go to `Application` tab
3. Click `Cookies` → Your domain
4. Right-click → `Clear`
5. Refresh page (`F5`)

**OR:** Use Incognito/Private window (`Ctrl+Shift+N`)

---

### 5️⃣ Test It

1. Go to: `http://localhost:3000/settings/integrations`
2. Click **"Connect with Facebook"**
3. Login to Facebook
4. Authorize the app
5. ✅ **Should work now!**

---

## 🔍 Verify Your Setup

**Before configuring Facebook, check your URLs:**

**Visit:** http://localhost:3000/api/debug/oauth-urls

This shows the **exact** URLs you need to add to Facebook.

---

## 🆘 Still Not Working?

### Check This:

1. **Environment variable loaded?**
   ```bash
   # In terminal, check if it shows your URL:
   curl http://localhost:3000/api/debug/oauth-urls
   ```

2. **Facebook URLs match exactly?**
   - No typos
   - HTTPS (not HTTP)
   - No trailing slashes
   - Both URLs added

3. **Server restarted after `.env.local` changes?**
   ```bash
   # Must restart to load new env vars
   npm run dev
   ```

4. **Cookies cleared?**
   - Old cookies cause issues
   - Use Incognito or clear cookies

---

## 📱 Using Ngrok (Local Testing)

**Why?** Facebook requires HTTPS URL. Localhost doesn't work.

**Setup:**
```bash
# 1. Start ngrok
ngrok http 3000

# 2. Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)

# 3. Add to .env.local:
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
NEXTAUTH_URL=https://abc123.ngrok-free.app

# 4. Add to Facebook App:
https://abc123.ngrok-free.app/api/facebook/callback
https://abc123.ngrok-free.app/api/facebook/callback-popup

# 5. Restart server
npm run dev
```

**⚠️ Note:** Ngrok URL changes every time you restart it. Update both `.env.local` and Facebook App when it changes.

---

## ✅ Checklist

Use this to track your progress:

- [ ] Updated `NEXT_PUBLIC_APP_URL` in `.env.local`
- [ ] Went to Facebook Developers Console
- [ ] Enabled "Client OAuth Login"
- [ ] Enabled "Web OAuth Login"
- [ ] Added first redirect URI: `/api/facebook/callback`
- [ ] Added second redirect URI: `/api/facebook/callback-popup`
- [ ] Clicked "Save Changes" in Facebook
- [ ] Restarted dev server
- [ ] Cleared browser cookies
- [ ] Tested OAuth flow
- [ ] 🎉 **IT WORKS!**

---

## 📚 More Help?

**Read these files:**
- `FACEBOOK_OAUTH_ERROR_ANALYSIS.md` - Detailed analysis
- `ANALYSIS_COMPLETE_SUMMARY.md` - Complete summary
- `NGROK_FIX.md` - Ngrok setup guide

---

## 🎯 Summary

**Problem:** Facebook blocks OAuth because redirect URI not whitelisted  
**Solution:** Configure environment variable + Facebook App settings  
**Time:** 5 minutes  
**Difficulty:** Easy ⭐  

**After this fix:**
✅ OAuth popup opens  
✅ Facebook login works  
✅ Page selector appears  
✅ Pages can be connected  

---

**Last Updated:** November 11, 2025  
**Status:** Ready to apply ✅

