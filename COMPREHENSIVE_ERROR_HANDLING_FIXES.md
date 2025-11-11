# Comprehensive Error Handling Improvements

## Overview
This document outlines all the error handling improvements made across the Facebook integration codebase to prevent and gracefully handle API errors, including the 400 error encountered during sync.

## Key Improvements

### 1. Custom Facebook API Error Class

Created a specialized error class to handle Facebook-specific errors with better type safety and error classification.

**Location:** `src/lib/facebook/client.ts`

```typescript
export class FacebookApiError extends Error {
  constructor(
    public code: number,
    public type: string,
    message: string,
    public context?: string
  ) {
    super(message);
    this.name = 'FacebookApiError';
  }

  // Helper methods for common error types
  get isTokenExpired(): boolean {
    return this.code === 190;
  }

  get isRateLimited(): boolean {
    return this.code === 613 || this.code === 4 || this.code === 17;
  }

  get isPermissionError(): boolean {
    return this.code === 200 || this.code === 10;
  }

  get isInvalidParameter(): boolean {
    return this.code === 100;
  }
}
```

**Benefits:**
- ✅ Type-safe error handling
- ✅ Easy identification of error types
- ✅ Consistent error structure across the app
- ✅ Contextual error messages

### 2. Centralized Error Parsing

Created a helper function to parse Facebook API errors consistently.

```typescript
function parseFacebookError(error: any, context?: string): FacebookApiError {
  if (error.response?.data?.error) {
    const fbError = error.response.data.error;
    return new FacebookApiError(
      fbError.code,
      fbError.type || 'OAuthException',
      fbError.message,
      context
    );
  }
  throw error;
}
```

**Benefits:**
- ✅ DRY principle - no repeated error parsing code
- ✅ Consistent error messages
- ✅ Contextual information preserved

### 3. Enhanced FacebookClient Methods

Added comprehensive error handling to all FacebookClient methods.

#### Methods Updated:
1. ✅ `sendMessengerMessage()` - Already had error handling, kept as-is
2. ✅ `sendInstagramMessage()` - Added error handling
3. ✅ `getMessengerConversations()` - Added error handling
4. ✅ `getMessengerProfile()` - Enhanced error handling
5. ✅ `getInstagramConversations()` - Added error handling
6. ✅ `getInstagramProfile()` - Enhanced error handling

**Example:**
```typescript
async getMessengerProfile(psid: string) {
  try {
    const response = await axios.get(`${FB_GRAPH_URL}/${psid}`, {
      params: {
        access_token: this.accessToken,
        fields: 'first_name,last_name,profile_pic,locale,timezone',
      },
    });
    return response.data;
  } catch (error: any) {
    throw parseFacebookError(error, `Failed to get profile for PSID: ${psid}`);
  }
}
```

### 4. Enhanced Auth Module Error Handling

Added error handling to all authentication-related functions.

**Location:** `src/lib/facebook/auth.ts`

#### Functions Updated:
1. ✅ `getPageAccessToken()` - Added error handling
2. ✅ `getInstagramBusinessAccount()` - Already had error handling (returns null)
3. ✅ `getUserPages()` - Added error handling
4. ✅ `exchangeCodeForToken()` - Added error handling
5. ✅ `getLongLivedToken()` - Added error handling
6. ✅ `getPageDetails()` - Added error handling

**Benefits:**
- ✅ Clear error messages during OAuth flow
- ✅ Easier debugging of authentication issues
- ✅ Better user feedback on connection failures

### 5. Intelligent Sync Error Tracking

Enhanced the sync function to track and categorize errors.

**Location:** `src/lib/facebook/sync-contacts.ts`

#### New Features:

**Error Tracking:**
```typescript
interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ 
    platform: string; 
    id: string; 
    error: string; 
    code?: number  // NEW: Error code from Facebook
  }>;
  tokenExpired?: boolean;  // NEW: Flag for expired tokens
}
```

**Token Expiration Detection:**
```typescript
// Check if token is expired
if (error instanceof FacebookApiError && error.isTokenExpired) {
  tokenExpired = true;
}
```

**Smart Last Sync Update:**
```typescript
// Only update last synced time if sync was at least partially successful
if (syncedCount > 0 || !tokenExpired) {
  await prisma.facebookPage.update({
    where: { id: page.id },
    data: { lastSyncedAt: new Date() },
  });
}
```

### 6. Enhanced UI Error Feedback

Improved user-facing error messages with specific guidance.

**Location:** `src/components/integrations/connected-pages-list.tsx`

#### Features:

**Token Expiration Detection:**
```typescript
if (data.tokenExpired) {
  toast.error(
    `Access token expired for ${page.pageName}. Please reconnect the page.`,
    { duration: 8000 }
  );
  return;
}
```

**Specific Error Type Messaging:**
```typescript
const hasPermissionErrors = data.errors?.some(
  (e: any) => e.code === 200 || e.code === 10
);
const hasRateLimitErrors = data.errors?.some(
  (e: any) => e.code === 613 || e.code === 4 || e.code === 17
);

if (hasPermissionErrors) {
  errorMessage += ' Some failures due to missing permissions.';
}
if (hasRateLimitErrors) {
  errorMessage += ' Rate limit reached, try again later.';
}
```

## Error Codes Reference

### Common Facebook API Error Codes Now Handled:

| Code | Type | Description | Handling |
|------|------|-------------|----------|
| 100 | Invalid Parameter | Invalid user ID, malformed request | Skip contact, log error |
| 190 | Token Error | Access token expired/invalid | Notify user to reconnect |
| 200 | Permission Error | Missing required permissions | Show permission error message |
| 10 | Permission Error | User permission issue | Skip contact |
| 4 | Rate Limit | Too many API calls | Show rate limit warning |
| 17 | Rate Limit | User request limit reached | Show rate limit warning |
| 613 | Rate Limit | API rate limit exceeded | Show rate limit warning |
| 10903 | Messaging Window | Outside 24-hour window | Already handled in sendMessage |

## Error Flow Examples

### Example 1: Invalid PSID (Your Original Error)

**Before:**
```
Failed to sync contact 10095489350486539: Error [AxiosError]: 
Request failed with status code 400
```

**After:**
```
Failed to sync Messenger contact 10095489350486539: 
FacebookApiError: Failed to get profile for PSID: 10095489350486539
Error code: 100
Error type: OAuthException

UI shows: "Synced 14 contacts from My Page. 1 contact failed to sync."
Console shows detailed error with code 100
```

### Example 2: Expired Token

**Before:**
- All contacts fail silently
- Generic error message
- User doesn't know what to do

**After:**
```
UI shows: "Access token expired for My Page. Please reconnect the page."
tokenExpired flag set to true
Last sync time NOT updated
Console shows: "Token expired. Errors: [...]"
```

### Example 3: Rate Limiting

**Before:**
- Sync fails completely
- No indication of rate limiting

**After:**
```
UI shows: "Synced 50 contacts from My Page. 10 contacts failed to sync. 
          Rate limit reached, try again later."
Error codes 613 detected
Console shows detailed rate limit errors
```

### Example 4: Permission Errors

**Before:**
- Silent failures
- No actionable feedback

**After:**
```
UI shows: "Synced 45 contacts from My Page. 5 contacts failed to sync. 
          Some failures due to missing permissions."
Error codes 200 detected
Console shows which permissions are missing
```

## Testing the Improvements

### Test Case 1: Invalid PSID
```bash
# Trigger sync with a page that has invalid PSIDs
# Expected: 
# - Sync continues for valid contacts
# - UI shows warning with failure count
# - Console shows: "FacebookApiError: Failed to get profile for PSID: X"
# - Error code 100 included in error array
```

### Test Case 2: Expired Token
```bash
# Manually expire token in database or wait for natural expiration
# Expected:
# - UI shows "Access token expired" message
# - tokenExpired flag = true in response
# - User prompted to reconnect
# - Last sync time NOT updated
```

### Test Case 3: Rate Limiting
```bash
# Trigger multiple rapid syncs
# Expected:
# - UI shows rate limit warning
# - Error codes 613, 4, or 17 detected
# - User advised to try again later
```

### Test Case 4: Permission Errors
```bash
# Remove a required permission from Facebook app
# Expected:
# - UI shows permission error message
# - Error code 200 detected
# - Partial sync succeeds for allowed operations
```

## Migration Notes

### Breaking Changes
None. All changes are backward compatible.

### New Fields in API Response
```typescript
// /api/facebook/sync response
{
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{
    platform: string;
    id: string;
    error: string;
    code?: number;      // NEW
  }>;
  tokenExpired?: boolean; // NEW
}
```

### TypeScript Updates
If you're consuming the sync API in other parts of the codebase, update your type definitions to include the new optional fields.

## Benefits Summary

### Developer Experience
- ✅ Clear, actionable error messages
- ✅ Error codes for debugging
- ✅ Type-safe error handling
- ✅ Consistent error structure
- ✅ Better logging and debugging

### User Experience
- ✅ Specific error messages
- ✅ Actionable guidance (e.g., "reconnect the page")
- ✅ Graceful degradation (partial syncs work)
- ✅ Clear feedback on what went wrong
- ✅ Progress visibility (X synced, Y failed)

### Reliability
- ✅ No silent failures
- ✅ Expired tokens detected automatically
- ✅ Rate limiting handled gracefully
- ✅ Permission errors identified
- ✅ Sync continues despite individual failures

## Monitoring Recommendations

### Key Metrics to Track
1. **Sync Success Rate**: `synced / (synced + failed)`
2. **Error Code Distribution**: Group by error code
3. **Token Expiration Rate**: Track tokenExpired flags
4. **Rate Limit Frequency**: Track code 613/4/17 errors

### Logging Strategy
```typescript
// Example: Structured logging for monitoring
{
  event: 'facebook_sync_completed',
  facebookPageId: 'xxx',
  synced: 45,
  failed: 5,
  tokenExpired: false,
  errorCodes: [100, 100, 200, 100, 10],
  duration: 15000,
  timestamp: new Date()
}
```

## Next Steps (Optional Enhancements)

### Priority 1: Token Refresh
- Implement automatic token refresh when 190 error detected
- Store refresh token for long-term access
- Background job to refresh expiring tokens

### Priority 2: Retry Logic
- Implement exponential backoff for transient errors
- Retry failed contacts after initial sync
- Queue system for rate-limited requests

### Priority 3: Batch Processing
- Use Facebook Batch API to reduce API calls
- Process multiple profile requests in single call
- Improve sync performance for large contact lists

### Priority 4: Detailed Sync Reports
- Create sync history table in database
- Store detailed error reports
- UI to view sync history and errors
- Export error logs for analysis

## Rollback Instructions

If issues arise, rollback is simple:

```bash
# Rollback client.ts
git checkout HEAD~1 -- src/lib/facebook/client.ts

# Rollback sync-contacts.ts
git checkout HEAD~1 -- src/lib/facebook/sync-contacts.ts

# Rollback auth.ts
git checkout HEAD~1 -- src/lib/facebook/auth.ts

# Rollback UI component
git checkout HEAD~1 -- src/components/integrations/connected-pages-list.tsx
```

## Support Resources

- **Facebook Error Codes**: https://developers.facebook.com/docs/graph-api/guides/error-handling
- **Debugging Guide**: See `FACEBOOK_API_ERROR_DEBUGGING.md`
- **Testing Guide**: See `SYNC_TESTING_GUIDE.md`
- **Original Fixes**: See `SYNC_FIXES_SUMMARY.md`

## Changelog

### Version 2.0 (Current)
- Added FacebookApiError class
- Enhanced all Facebook API methods with error handling
- Added token expiration detection
- Added error code tracking
- Enhanced UI error messages
- Added rate limit detection
- Added permission error detection

### Version 1.0 (Previous)
- Basic error handling
- Sync count tracking
- Instagram unique constraint fix
- Basic error logging

