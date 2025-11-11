# Facebook Graph API Error Debugging Guide

## Common Error Codes & Solutions

### Error 400: Bad Request

**Causes:**
1. **Invalid PSID/User ID** (most common)
2. **Malformed request parameters**
3. **Expired or revoked user permissions**

### Error 100: Invalid Parameter

**Example:** `Facebook API Error (100): Invalid user ID - PSID: 10095489350486539`

**Common Causes:**
- User blocked the page
- User deleted their Facebook/Instagram account
- PSID is from a test user that no longer exists
- PSID format is incorrect for the API version

**Solution:**
- ✅ Skip the contact and continue (already implemented)
- Log the error for manual review
- Consider cleaning up stale PSIDs periodically

### Error 190: Access Token Issues

**Types:**
- `190` - Access token has expired
- `190` - Access token has been invalidated
- `190` - User changed password

**Solution:**
- Prompt user to reconnect their Facebook account
- Implement token refresh logic
- Update `pageAccessToken` in database

### Error 200: Permission Denied

**Causes:**
- Missing required permissions
- User revoked permissions
- Page access token doesn't have required scopes

**Required Permissions:**
- `pages_show_list` - List pages
- `pages_messaging` - Send messages
- `pages_read_engagement` - Read conversations
- `pages_manage_metadata` - Get page info
- `instagram_basic` - Instagram access (if using IG)
- `instagram_manage_messages` - Instagram DMs (if using IG)

**Solution:**
- Re-authenticate with correct permissions
- Check Facebook App settings for required permissions

### Error 10: Permission Denied (User Privacy)

**Cause:**
- User's privacy settings prevent profile access
- User opted out of platform messaging

**Solution:**
- Skip the contact (already implemented)
- Store minimal information (just the PSID)

### Error 613: Rate Limit Exceeded

**Cause:**
- Too many API calls in a short time

**Solution:**
- Implement rate limiting (not yet implemented)
- Add delays between API calls
- Use batch requests for multiple operations

## Debugging Steps

### Step 1: Check Server Logs

With the new error handling, you'll see detailed errors:

```
Failed to sync Messenger contact 10095489350486539: 
Facebook API Error (100): Invalid user ID - PSID: 10095489350486539
```

### Step 2: Verify Access Token

Test the page access token manually:

```bash
curl "https://graph.facebook.com/v19.0/me?access_token=YOUR_TOKEN"
```

Should return page information. If it returns an error, the token is invalid.

### Step 3: Check Token Permissions

```bash
curl "https://graph.facebook.com/v19.0/me/permissions?access_token=YOUR_TOKEN"
```

Verify all required permissions are granted and status is "granted".

### Step 4: Test Individual PSID

```bash
curl "https://graph.facebook.com/v19.0/PSID?fields=first_name,last_name&access_token=YOUR_TOKEN"
```

If this fails with 400, the PSID is invalid.

### Step 5: Check Conversations API

```bash
curl "https://graph.facebook.com/v19.0/PAGE_ID/conversations?fields=participants&access_token=YOUR_TOKEN"
```

Verify you can fetch conversations. If successful, the issue is with specific PSIDs.

## Handling Specific Scenarios

### Scenario 1: User Blocked the Page

**Symptom:** 400 error when accessing PSID

**Behavior:** 
- Contact sync will fail for that user
- Error logged but sync continues
- Other contacts sync normally

**Action:** 
- No action required
- Consider marking contact as "inactive" in future enhancement

### Scenario 2: Expired Page Access Token

**Symptom:** 190 error for all requests

**Behavior:**
- All contacts fail to sync
- API returns "Invalid OAuth access token"

**Action:**
1. Go to Settings → Integrations
2. Disconnect the page
3. Reconnect with Facebook OAuth flow
4. Re-sync contacts

### Scenario 3: Permission Revoked

**Symptom:** 200 error with "Permission denied"

**Behavior:**
- Specific API calls fail
- Other calls may succeed

**Action:**
1. Review Facebook App permissions in Facebook Developer Portal
2. Ensure all required permissions are requested in OAuth flow
3. User must re-authorize with correct permissions

### Scenario 4: Test Users/Pages

**Symptom:** 100 error for test PSIDs

**Behavior:**
- Test user PSIDs fail to sync
- Real user PSIDs work fine

**Action:**
- Use production accounts for testing
- Clean up test data from database

## Monitoring Sync Health

### Key Metrics to Track

1. **Success Rate:** `synced / (synced + failed)`
2. **Error Types:** Group errors by Facebook error code
3. **Failure Patterns:** Track which PSIDs consistently fail
4. **Sync Duration:** Monitor API call performance

### Implementing Monitoring (Future Enhancement)

```typescript
// Example: Track sync metrics
interface SyncMetrics {
  totalAttempted: number;
  successful: number;
  failed: number;
  errorsByCode: Record<string, number>;
  duration: number;
  timestamp: Date;
}

// Store in database for historical analysis
await prisma.syncLog.create({
  data: {
    facebookPageId: page.id,
    metrics: syncMetrics,
  },
});
```

## Best Practices

### 1. Graceful Degradation
✅ Continue sync even if some contacts fail (implemented)
✅ Return partial success with error details (implemented)
✅ Log errors for debugging (implemented)

### 2. Error Recovery
⏳ Implement retry logic for transient errors (not yet implemented)
⏳ Exponential backoff for rate limits (not yet implemented)
⏳ Automatic token refresh (not yet implemented)

### 3. User Communication
✅ Show clear success/failure messages (implemented)
✅ Distinguish between partial and complete failures (implemented)
⏳ Provide actionable error messages (partially implemented)

### 4. Data Quality
✅ Validate PSIDs before API calls (basic validation implemented)
✅ Handle missing profile data gracefully (implemented)
⏳ Clean up stale contacts periodically (not yet implemented)

## Testing Sync Errors

### Test Case 1: Invalid PSID
```typescript
// Manually trigger with invalid PSID
const result = await syncContacts(pageId);
console.log(result);
// Expected: { synced: X, failed: 1, errors: [...] }
```

### Test Case 2: Expired Token
```typescript
// Update token to invalid value in database
await prisma.facebookPage.update({
  where: { id: pageId },
  data: { pageAccessToken: 'invalid_token' },
});
// Try sync - should fail with clear error
```

### Test Case 3: Partial Failure
- Ensure some contacts succeed and some fail
- UI should show warning with both counts
- Console should show error details

## Facebook API Version Notes

**Current Version:** v19.0

**Breaking Changes to Watch:**
- PSIDs may change format in major versions
- Field names may be deprecated
- Permission requirements may change
- Rate limits may be adjusted

**Recommendation:** 
- Pin to specific API version in production
- Test thoroughly before upgrading API version
- Read Facebook Platform Changelog regularly

## Quick Reference: Error Response Format

```json
{
  "error": {
    "message": "Invalid user ID",
    "type": "OAuthException",
    "code": 100,
    "error_subcode": 1234,
    "fbtrace_id": "A..."
  }
}
```

**Key Fields:**
- `code` - Main error code (e.g., 100, 190, 200)
- `message` - Human-readable error description
- `error_subcode` - More specific error details
- `fbtrace_id` - Facebook trace ID for support tickets

## Getting Help

1. **Facebook Developer Docs:** https://developers.facebook.com/docs/graph-api/
2. **Error Reference:** https://developers.facebook.com/docs/graph-api/guides/error-handling
3. **Support:** https://developers.facebook.com/support/

## Changelog

### 2024-11-11
- Added detailed error handling in FacebookClient
- Implemented sync result tracking with counts
- Added error aggregation and reporting
- Fixed Instagram unique constraint issue
- Enhanced UI feedback for partial failures

