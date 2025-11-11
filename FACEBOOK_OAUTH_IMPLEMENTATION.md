# Facebook OAuth Integration Implementation

## Summary

Successfully implemented Facebook OAuth integration that allows users to authenticate with Facebook, select multiple pages to connect, and automatically save them with proper access tokens.

## What Was Implemented

### 1. OAuth Helper Functions (`src/lib/facebook/auth.ts`)
- `exchangeCodeForToken()` - Exchange OAuth code for user access token
- `getLongLivedToken()` - Convert short-lived token to long-lived (60 days)
- `getPageDetails()` - Fetch page details with Instagram account info
- `generateOAuthUrl()` - Generate Facebook OAuth URL with required permissions

### 2. API Routes

#### OAuth Initiation (`src/app/api/facebook/oauth/route.ts`)
- Generates OAuth URL with CSRF protection
- Redirects user to Facebook login dialog

#### OAuth Callback (`src/app/api/facebook/callback/route.ts`)
- Handles Facebook OAuth callback
- Exchanges authorization code for access token
- Validates state parameter for security
- Redirects to integrations page with token

#### Pages Management (`src/app/api/facebook/pages/route.ts`)
- **GET** - Fetch user's Facebook pages with connection status
- **POST** - Save multiple selected pages to database
- **DELETE** - Disconnect a Facebook page

#### Connected Pages (`src/app/api/facebook/pages/connected/route.ts`)
- **GET** - Fetch organization's connected Facebook pages

### 3. UI Components

#### Facebook Page Selector Dialog (`src/components/integrations/facebook-page-selector-dialog.tsx`)
- Modal dialog for selecting multiple Facebook pages
- Shows which pages are already connected
- Checkbox list with Select All functionality
- Displays page name, ID, and Instagram indicator
- Loading and saving states

#### Connected Pages List (`src/components/integrations/connected-pages-list.tsx`)
- Displays all connected Facebook pages
- Shows page details: name, ID, Instagram account
- Sync button to manually sync contacts
- Disconnect button with confirmation dialog
- Shows last sync timestamp

#### Updated Integrations Page (`src/app/(dashboard)/settings/integrations/page.tsx`)
- Replaced manual token input with OAuth flow
- "Connect with Facebook" button
- Displays connected pages list
- Shows setup instructions with dynamic URLs
- Handles OAuth callback and errors

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Facebook App Credentials
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# App URL (for OAuth redirect)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL

# Facebook Webhook (already exists)
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_verify_token
```

## Facebook App Configuration

### 1. Create Facebook App
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app
3. Add Messenger product

### 2. Add OAuth Redirect URIs
In Facebook App Settings → Basic → App Domains, add:
```
{YOUR_APP_URL}/api/facebook/callback
```

Example:
- Development: `http://localhost:3000/api/facebook/callback`
- Production: `https://yourdomain.com/api/facebook/callback`

### 3. Required Permissions
Your app needs these permissions:
- `pages_show_list` - List user's Facebook pages
- `pages_messaging` - Send messages on behalf of pages
- `pages_read_engagement` - Read page engagement data
- `instagram_basic` - Access Instagram account info
- `instagram_manage_messages` - Send Instagram DMs

### 4. Webhook Configuration
- **Callback URL**: `{YOUR_APP_URL}/api/webhooks/facebook`
- **Verify Token**: Use the value from `FACEBOOK_WEBHOOK_VERIFY_TOKEN` in .env

## User Flow

1. User clicks "Connect with Facebook" button
2. Redirected to Facebook OAuth login dialog
3. User authorizes the app and grants permissions
4. Facebook redirects back to `/api/facebook/callback`
5. App exchanges code for long-lived access token
6. User is redirected to integrations page
7. Page selector dialog opens automatically
8. User selects one or more pages to connect
9. App fetches page-specific access tokens
10. Pages are saved to database with Instagram info
11. Connected pages appear in the list

## Features

### Multi-Page Selection
- Users can connect multiple Facebook pages at once
- Each page gets its own page-specific access token
- Instagram business accounts are automatically detected

### Security
- CSRF protection using state parameter
- Long-lived tokens (60 days) instead of short-lived
- Page-specific tokens stored securely

### User Experience
- Clean OAuth flow (no manual token entry)
- Shows which pages are already connected
- Displays Instagram account status
- Manual sync capability
- Easy disconnect with confirmation

### Page Management
- View all connected pages
- See last sync timestamp
- Manual sync trigger
- Disconnect individual pages

## Files Created

- `src/app/api/facebook/oauth/route.ts`
- `src/app/api/facebook/callback/route.ts`
- `src/app/api/facebook/pages/route.ts`
- `src/app/api/facebook/pages/connected/route.ts`
- `src/components/integrations/facebook-page-selector-dialog.tsx`
- `src/components/integrations/connected-pages-list.tsx`

## Files Modified

- `src/lib/facebook/auth.ts` - Added OAuth helper functions
- `src/app/(dashboard)/settings/integrations/page.tsx` - Complete overhaul with OAuth flow

## Testing Checklist

- [ ] Set up environment variables in `.env.local`
- [ ] Configure Facebook App with redirect URI
- [ ] Test OAuth flow (authorize with Facebook)
- [ ] Test page selection (select multiple pages)
- [ ] Verify pages are saved to database
- [ ] Test connected pages list display
- [ ] Test manual sync functionality
- [ ] Test disconnect functionality
- [ ] Verify Instagram accounts are detected
- [ ] Test error handling (cancel OAuth, deny permissions)

## Next Steps

1. Add environment variables to `.env.local`
2. Configure Facebook App settings
3. Test the OAuth flow
4. Optional: Add token encryption for production
5. Optional: Implement automatic token refresh
6. Optional: Add webhook subscription during page connection

## Security Considerations

### Production Recommendations
1. **Encrypt Access Tokens**: Currently stored as plain text in database
   - Add encryption at rest for `pageAccessToken` field
   - Use something like `@prisma/client` field-level encryption

2. **Token Rotation**: Implement automatic token refresh
   - Facebook tokens expire after 60 days
   - Add background job to refresh tokens before expiry

3. **Rate Limiting**: Add rate limiting to OAuth endpoints
   - Prevent abuse of OAuth flow
   - Use middleware or rate limiting library

4. **Audit Logging**: Log all page connections/disconnections
   - Track who connected what page and when
   - Useful for security and compliance

## Notes

- OAuth flow uses long-lived user access tokens (60 days)
- Page access tokens don't expire if page is active
- Instagram accounts are automatically detected if linked to Facebook page
- Multiple pages can be selected and connected in one flow
- Each page maintains its own access token
- Pages can be synced manually or automatically (based on `autoSync` setting)

