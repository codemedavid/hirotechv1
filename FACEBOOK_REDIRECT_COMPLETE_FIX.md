# Facebook OAuth Redirect Issue - Complete Fix ✅

## 🎯 Problem Solved

**Original Issue:** After Facebook OAuth login, users were being redirected to `localhost` URLs instead of the configured production URL, requiring manual URL editing.

## ✅ Solutions Implemented

### 1. Fixed Callback Redirect URLs ✓

**Problem:** The callback route was using `request.url` which contained localhost.

**Fix:** Updated `/api/facebook/callback/route.ts` to use `NEXT_PUBLIC_APP_URL` environment variable instead.

```typescript
// Before: Used request.url (contained localhost)
const redirectUrl = new URL('/settings/integrations', request.url);

// After: Uses configured base URL
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
const redirectUrl = new URL('/settings/integrations', baseUrl);
```

### 2. Implemented Popup-Based OAuth Flow ✓ (Recommended)

**Why:** Popup flow provides better UX and completely avoids redirect issues.

**What Changed:**
- OAuth now opens in a centered popup window (600x700px)
- After authentication, popup sends a message to parent window
- Parent window receives token and opens page selector
- Popup closes automatically
- Main page never navigates away

**Files Modified:**
1. `src/app/(dashboard)/settings/integrations/page.tsx` - Opens OAuth in popup
2. `src/app/api/facebook/callback-popup/route.ts` - New popup callback handler
3. `src/app/api/facebook/oauth/route.ts` - Supports popup mode
4. `src/lib/facebook/auth.ts` - Generates popup-optimized OAuth URLs

## 📋 Setup Required

### Step 1: Set Environment Variable

Ensure your `.env` file has the correct URL:

```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

**Important:** 
- For production: Use your actual domain
- For local testing: Use ngrok URL (e.g., `https://abc123.ngrok.io`)
- NO localhost URLs for Facebook OAuth

### Step 2: Update Facebook App Settings

Add BOTH callback URLs to Facebook App → Facebook Login → Settings → Valid OAuth Redirect URIs:

```
https://your-production-domain.com/api/facebook/callback
https://your-production-domain.com/api/facebook/callback-popup
```

### Step 3: Restart Your Application

```bash
# Stop your server (Ctrl+C)
npm run dev
```

## 🚀 How It Works Now

### User Experience:

1. **User clicks "Connect with Facebook"**
   - A popup window opens (600x700px, centered)
   - Main page stays on integrations screen

2. **User authenticates with Facebook**
   - Facebook login happens in popup
   - User grants permissions in popup

3. **Authentication completes**
   - Popup receives access token
   - Popup sends message to parent window
   - Popup shows success message and closes
   - Main page opens Facebook Page Selector dialog

4. **User selects pages**
   - No page navigation occurred
   - Seamless experience

### Technical Flow:

```
1. User clicks button
   ↓
2. Open /api/facebook/oauth?popup=true in popup
   ↓
3. OAuth route generates Facebook URL with popup callback
   ↓
4. User authenticates on Facebook
   ↓
5. Facebook redirects to /api/facebook/callback-popup
   ↓
6. Popup callback exchanges code for token
   ↓
7. Popup renders HTML with postMessage script
   ↓
8. Message sent to parent window with token
   ↓
9. Parent receives message and opens page selector
   ↓
10. Popup closes automatically
```

## 🔍 Testing

### Test the Configuration

1. Visit `/api/debug/facebook-config` to verify:
   - ✅ `NEXT_PUBLIC_APP_URL` is set correctly
   - ✅ Redirect URIs match Facebook App settings

2. Test the OAuth flow:
   - Click "Connect with Facebook"
   - Popup should open (not redirect)
   - After auth, popup should close
   - Page selector should appear
   - Main page should NOT navigate away

### Debug Logs

Check console for these messages:

```
=== FACEBOOK OAUTH DEBUG ===
NEXT_PUBLIC_APP_URL: https://your-domain.com ✅
OAuth flow type: Popup
✅ Redirecting to Facebook OAuth...
```

## 📁 Files Modified

### New Files:
- `src/app/api/facebook/callback-popup/route.ts` - Popup callback handler

### Modified Files:
- `src/app/api/facebook/callback/route.ts` - Fixed redirect URLs
- `src/app/api/facebook/oauth/route.ts` - Added popup support
- `src/lib/facebook/auth.ts` - Updated OAuth URL generation
- `src/app/(dashboard)/settings/integrations/page.tsx` - Popup implementation

### Documentation Files:
- `ENV_SETUP_GUIDE.md` - Complete environment setup
- `FACEBOOK_REDIRECT_FIX.md` - Quick fix guide
- `FACEBOOK_REDIRECT_COMPLETE_FIX.md` - This file

## 🎨 Features

### Popup Window Features:
- ✅ Centered on screen
- ✅ Optimal size (600x700px)
- ✅ Clean toolbar-free interface
- ✅ Automatic closing
- ✅ Beautiful success/error pages
- ✅ Loading spinner with messages
- ✅ Secure postMessage communication

### Error Handling:
- ✅ User cancellation handled gracefully
- ✅ Network errors shown to user
- ✅ CSRF protection maintained
- ✅ Toast notifications for errors
- ✅ Popup closes on error

### Fallback Support:
- ✅ Regular redirect flow still works
- ✅ Environment validation
- ✅ Detailed debug logging
- ✅ Both callback URLs supported

## 🔧 Configuration Reference

### Environment Variables Required:

```env
# App URL - CRITICAL for OAuth
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Facebook Credentials
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your-webhook-token

# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=your-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# Redis
REDIS_URL=redis://localhost:6379
```

### Facebook App Settings:

**Valid OAuth Redirect URIs:**
```
https://your-domain.com/api/facebook/callback
https://your-domain.com/api/facebook/callback-popup
```

**Permissions Required:**
- `pages_show_list` - List user's pages
- `pages_messaging` - Send messages
- `pages_read_engagement` - Read conversations
- `pages_manage_metadata` - Manage page settings

## 🚨 Important Notes

### For Local Development:
- Facebook OAuth requires HTTPS (not localhost)
- Use ngrok: `ngrok http 3000`
- Update `NEXT_PUBLIC_APP_URL` to ngrok URL
- Add ngrok URLs to Facebook App settings

### For Production (Vercel):
1. Add environment variables in Vercel Dashboard
2. Add production URLs to Facebook App
3. Redeploy after environment changes

### Security:
- Popup uses `postMessage` with origin verification
- CSRF protection via state parameter
- Secure token exchange
- Tokens never exposed in URLs (except temporarily for legacy support)

## ✅ Verification Checklist

Before testing, ensure:

- [ ] `.env` file exists with `NEXT_PUBLIC_APP_URL` set
- [ ] `NEXT_PUBLIC_APP_URL` is NOT localhost (use ngrok or production URL)
- [ ] Both callback URLs added to Facebook App settings
- [ ] Facebook App has required permissions
- [ ] Development server restarted after `.env` changes
- [ ] Console shows correct `NEXT_PUBLIC_APP_URL` in logs

## 🎉 Expected Behavior

After implementing these fixes:

1. ✅ No more localhost redirects
2. ✅ Popup-based OAuth (better UX)
3. ✅ No manual URL editing needed
4. ✅ Seamless authentication flow
5. ✅ Clear error messages
6. ✅ Professional user experience

## 📞 Troubleshooting

### Issue: Popup blocked
**Solution:** Ensure popup blockers allow popups for your domain

### Issue: Popup doesn't close
**Solution:** Check browser console for postMessage errors

### Issue: Still seeing localhost
**Solution:** 
1. Verify `.env` file location (project root)
2. Restart development server
3. Check `/api/debug/facebook-config`

### Issue: "Redirect URI mismatch" error
**Solution:** 
1. Copy exact URL from `/api/debug/facebook-config`
2. Add to Facebook App settings (including both callback URLs)
3. No trailing slashes

## 🎯 Summary

Two fixes implemented:

1. **Quick Fix:** Callback routes now use `NEXT_PUBLIC_APP_URL` instead of `request.url`
2. **Better Solution:** Popup-based OAuth flow (no page navigation needed)

Both fixes solve the localhost redirect issue. The popup flow is recommended for better UX.

---

**Need Help?** Check:
- `ENV_SETUP_GUIDE.md` - Environment configuration
- `FACEBOOK_REDIRECT_FIX.md` - Quick troubleshooting
- Console logs when clicking "Connect Facebook"

