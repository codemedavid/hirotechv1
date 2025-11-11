# Testing the Fixed Facebook Sync Functionality

## Quick Start

1. **Start your development server:**
```bash
npm run dev
```

2. **Navigate to Integrations:**
   - Go to http://localhost:3000/settings/integrations
   - Ensure you have a Facebook page connected

3. **Trigger a Sync:**
   - Click the "Sync" button on a connected page
   - Watch for the toast notification

## What to Expect

### ✅ Successful Sync (All Contacts)
**Toast Message:**
```
Synced 15 contacts from My Facebook Page
```

**Console Output:**
```
✓ Compiled in XXXms
POST /api/facebook/sync 200 in X.Xs
```

### ⚠️ Partial Success (Some Failures)
**Toast Message:**
```
⚠ Synced 12 contacts from My Facebook Page. 3 contacts failed to sync.
```

**Browser Console:**
```javascript
Sync errors: [
  {
    platform: "Messenger",
    id: "10095489350486539",
    error: "Facebook API Error (100): Invalid user ID - PSID: 10095489350486539"
  }
]
```

**Server Console:**
```
Failed to sync Messenger contact 10095489350486539: 
Facebook API Error (100): Invalid user ID - PSID: 10095489350486539
```

### ❌ Complete Failure
**Toast Message:**
```
Failed to sync contacts
```

**Example Causes:**
- Invalid page access token
- Page not found
- Network error

## Testing Scenarios

### Scenario 1: Normal Sync with Valid Contacts

**Steps:**
1. Ensure you have a page with active Messenger conversations
2. Click "Sync" button
3. Wait for completion

**Expected Result:**
- Success toast with contact count
- Page shows updated "Last synced" time
- Contacts appear in Contacts page

### Scenario 2: Sync with Invalid PSIDs

**What Happens:**
- The 400 error you encountered should now be handled gracefully
- Sync continues for other contacts
- You'll see a warning toast with failure count
- Detailed errors in browser console

**Steps:**
1. Click "Sync" on a page that has some invalid PSIDs
2. Check the toast notification
3. Open browser DevTools → Console
4. Look for "Sync errors:" log

**Expected Result:**
```javascript
⚠ Warning toast: "Synced 5 contacts from Page. 1 contact failed to sync."

Console:
Sync errors: [{
  platform: "Messenger",
  id: "10095489350486539",
  error: "Facebook API Error (100): Invalid user ID - PSID: 10095489350486539"
}]
```

### Scenario 3: Instagram Contacts

**Prerequisites:**
- Connected page must have Instagram Business account linked
- Must have Instagram DM conversations

**Steps:**
1. Verify page has `instagramAccountId` and `instagramUsername` displayed
2. Click "Sync"
3. Check Contacts page for Instagram contacts

**Expected Result:**
- Both Messenger and Instagram contacts synced
- No unique constraint errors
- Instagram contacts have Instagram icon badge

### Scenario 4: Re-sync Existing Contacts

**Steps:**
1. Sync a page for the first time
2. Immediately sync again
3. Check the contact count

**Expected Result:**
- Contacts are updated, not duplicated
- Sync count may be same or higher (if new conversations)
- No database errors

## Verifying the Fixes

### Fix #1: Sync Count Display

**Before:**
```
Synced undefined contacts from My Facebook Page
```

**After:**
```
Synced 15 contacts from My Facebook Page
```

**How to Verify:**
- Look at the toast message
- Should show actual number, not "undefined"

### Fix #2: Instagram Unique Constraint

**Before:**
```
Error: Unique constraint failed on the constraint: `messengerPSID_facebookPageId`
```

**After:**
- No unique constraint errors
- Instagram contacts sync successfully
- Existing contacts updated properly

**How to Verify:**
- Sync a page with Instagram
- Check server logs for errors
- Should see no Prisma constraint errors

### Fix #3: Error Details

**Before:**
```
Failed to sync contact 10095489350486539: Error [AxiosError]: 
Request failed with status code 400
```

**After:**
```
Failed to sync Messenger contact 10095489350486539: 
Facebook API Error (100): Invalid user ID - PSID: 10095489350486539
```

**How to Verify:**
- Check server console during sync
- Errors should include Facebook error code and message
- Errors should specify platform (Messenger/Instagram)

### Fix #4: Partial Failure Handling

**Before:**
- Silent failures
- No user notification about failed contacts

**After:**
- Warning toast for partial failures
- Error details in console
- Sync continues for other contacts

**How to Verify:**
- Trigger a sync that has some invalid PSIDs
- Should see warning toast, not error
- Should see both success and failure counts

## Database Verification

### Check Synced Contacts

```sql
-- See all contacts from a specific page
SELECT 
  "firstName",
  "lastName",
  "hasMessenger",
  "hasInstagram",
  "lastInteraction"
FROM "Contact"
WHERE "facebookPageId" = 'YOUR_PAGE_ID'
ORDER BY "createdAt" DESC;
```

### Check Last Sync Time

```sql
-- Verify sync timestamp updated
SELECT 
  "pageName",
  "lastSyncedAt"
FROM "FacebookPage"
WHERE id = 'YOUR_PAGE_ID';
```

### Check for Duplicates

```sql
-- Should return 0 rows
SELECT 
  "messengerPSID",
  "facebookPageId",
  COUNT(*)
FROM "Contact"
WHERE "messengerPSID" IS NOT NULL
GROUP BY "messengerPSID", "facebookPageId"
HAVING COUNT(*) > 1;
```

## API Testing

### Test via cURL

```bash
# Get your session token from browser DevTools
# Application → Cookies → next-auth.session-token

curl -X POST http://localhost:3000/api/facebook/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"facebookPageId": "YOUR_PAGE_ID"}'
```

**Expected Response:**
```json
{
  "success": true,
  "synced": 15,
  "failed": 3,
  "errors": [
    {
      "platform": "Messenger",
      "id": "10095489350486539",
      "error": "Facebook API Error (100): Invalid user ID - PSID: 10095489350486539"
    }
  ]
}
```

## Performance Testing

### Measure Sync Duration

```typescript
// In browser console
console.time('sync');
// Click sync button
// Wait for completion
console.timeEnd('sync');
```

**Expected:**
- Small pages (< 50 contacts): 5-15 seconds
- Medium pages (50-200 contacts): 15-60 seconds
- Large pages (> 200 contacts): 60+ seconds

**Note:** Each contact requires 1 API call, so sync time grows linearly with contact count.

## Troubleshooting

### Issue: Still seeing "undefined" in toast

**Cause:** Browser cache or stale component

**Solution:**
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Restart dev server

### Issue: Instagram contacts not syncing

**Check:**
1. Page has `instagramAccountId` set in database
2. Page access token has Instagram permissions
3. Instagram account has conversations

**SQL Query:**
```sql
SELECT 
  "pageName",
  "instagramAccountId",
  "instagramUsername"
FROM "FacebookPage"
WHERE id = 'YOUR_PAGE_ID';
```

### Issue: All contacts failing

**Common Causes:**
1. Invalid or expired page access token
2. Missing permissions
3. Facebook API rate limiting

**Check:**
```bash
# Test access token
curl "https://graph.facebook.com/v19.0/me?access_token=YOUR_TOKEN"
```

### Issue: Duplicate contacts

**Check unique constraints:**
```sql
-- Find duplicates
SELECT 
  "messengerPSID",
  COUNT(*)
FROM "Contact"
WHERE "messengerPSID" IS NOT NULL
GROUP BY "messengerPSID"
HAVING COUNT(*) > 1;
```

**Solution:** Clean up manually or disconnect and reconnect page

## Success Checklist

- [ ] No "undefined" in success messages
- [ ] Contact counts displayed correctly
- [ ] Partial failures show warning toast
- [ ] Error details in console are readable
- [ ] Instagram contacts sync without constraint errors
- [ ] No duplicate contacts created
- [ ] Last sync time updates correctly
- [ ] Sync continues even if some contacts fail
- [ ] Server logs show detailed Facebook error messages

## Next Steps After Testing

1. **Monitor Production:** Watch for error patterns
2. **Clean Up:** Remove any test contacts/pages
3. **Document:** Note any recurring error codes
4. **Optimize:** Consider batch processing for large pages
5. **Enhance:** Add scheduled auto-sync (utilize `autoSync` field)

## Need Help?

- Check `SYNC_FIXES_SUMMARY.md` for detailed changes
- Check `FACEBOOK_API_ERROR_DEBUGGING.md` for error codes
- Review server and browser console logs
- Check Facebook Developer Console for API issues

