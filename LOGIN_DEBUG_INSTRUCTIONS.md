# 🔍 Login Debug Instructions

## What I Found
Node testing shows that NextAuth is **not setting session cookies** even though authorization succeeds.

## What I Fixed
1. ✅ Added explicit cookie configuration
2. ✅ Added `basePath: '/api/auth'`
3. ✅ Added debug mode
4. ✅ Updated login page with better logging
5. ✅ Changed to hard redirect (`window.location.href`)

## How to Test Now

### Step 1: Restart Dev Server
The auth configuration changed, so you need to restart:
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### Step 2: Open Browser Console
1. Open http://localhost:3000/login
2. Press F12 to open Developer Tools
3. Go to "Console" tab

### Step 3: Try Logging In
Enter credentials:
- Email: `admin1@admin.com`
- Password: `admin1234`

### Step 4: Check Console Logs
You should see:
```
[Login] Attempting sign in...
[Auth] Attempting login for: admin1@admin.com
[Auth] Login successful for: admin1@admin.com
[Login] SignIn result: { ok: true, status: 200, ... }
[Login] Success! Redirecting...
```

### Step 5: Check Cookies
In Developer Tools:
1. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
2. Click "Cookies" → http://localhost:3000
3. Look for `next-auth.session-token`

**If you see the cookie**: ✅ Login is working!  
**If no cookie**: ❌ Still an issue

## If Still Not Working

### Check 1: Environment Variables
Make sure `.env.local` exists and has:
```env
NEXTAUTH_SECRET=pq6GRj+B7ThovSMOjdIKRW4QLBavKA6E7xgKqSW5nMk=
NEXTAUTH_URL=http://localhost:3000
```

### Check 2: Browser is Blocking Cookies
- Try in Incognito mode
- Check if browser extensions are blocking cookies
- Try a different browser

### Check 3: Dev Server Logs
Look at your terminal where `npm run dev` is running.
With debug mode enabled, you should see detailed NextAuth logs.

## Alternative: Use Server Action

If client-side signIn still doesn't work, we can switch to a server action approach which is more reliable with NextAuth v5.

Let me know if:
1. ✅ Cookie appears in browser
2. ❌ Still no cookie
3. 📋 What the console logs show

This will help me determine the next fix!

