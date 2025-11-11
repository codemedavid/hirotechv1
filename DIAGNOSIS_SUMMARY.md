# Internal Server Error - Root Cause Analysis

## 🔴 **PROBLEM IDENTIFIED**

Your application is experiencing **500 Internal Server Errors** due to:

### Primary Issue: **Prisma Query Engine File Lock**

```
Error: EPERM: operation not permitted, rename 
'C:\Users\bigcl\Downloads\hiro\node_modules\.prisma\client\query_engine-windows.dll.node.tmp41664' 
-> 'C:\Users\bigcl\Downloads\hiro\node_modules\.prisma\client\query_engine-windows.dll.node'
```

## 🔍 **What This Means**

1. **7 Node.js processes are running** simultaneously
2. These processes have **locked the Prisma query engine file**
3. Prisma client **cannot regenerate** properly
4. **All database operations fail** → 500 Internal Server Error
5. Affects: Login, Registration, Contacts, Campaigns, etc.

## 🎯 **Why This Happened**

### Common Causes:
- ✗ Closing terminal windows without stopping processes (`Ctrl+C`)
- ✗ Running multiple `npm run dev` sessions
- ✗ Starting worker without stopping previous instance
- ✗ System crashes leaving orphaned Node processes
- ✗ Dev server crashes without cleanup

### Technical Explanation:
Windows locks `.dll` files when in use. When Node.js processes crash or are killed improperly, they don't release file handles. Prisma tries to regenerate the query engine but fails because the file is locked.

## ✅ **SOLUTION**

### Quick Fix (Recommended)

Run the automated fix script:

```bash
.\quick-fix.bat
```

This will:
1. ✅ Kill all Node.js processes
2. ✅ Clean Prisma client cache
3. ✅ Regenerate Prisma client
4. ✅ Verify database connection

### Manual Fix

If the script doesn't work:

```bash
# 1. Stop all Node processes
taskkill /F /IM node.exe /T

# 2. Clean Prisma
npm run clean-prisma

# 3. Reinstall
npm install

# 4. Regenerate Prisma
npx prisma generate

# 5. Push schema
npx prisma db push
```

## 🧪 **Verification Steps**

After applying the fix:

### 1. Run Diagnostics
```bash
npm run diagnose
```

### 2. Test Prisma
```bash
npx prisma studio
```

### 3. Test Application
```bash
# Terminal 1
npm run dev

# Terminal 2 (separate terminal)
npm run worker
```

### 4. Test Endpoints

**Test Registration:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "organizationName": "Test Org"
  }'
```

**Test Login:**
Visit `http://localhost:3000/login`

## 📊 **Impact Analysis**

### Affected Routes:
- ❌ `/api/auth/register` - Cannot create users
- ❌ `/api/auth/[...nextauth]` - Cannot authenticate
- ❌ `/api/contacts` - Cannot query contacts
- ❌ `/api/campaigns` - Cannot query campaigns
- ❌ `/api/facebook/*` - Cannot sync data
- ❌ `/api/pipelines` - Cannot access pipelines
- ❌ `/api/tags` - Cannot manage tags

### System Components:
- ❌ **Database Layer**: All Prisma operations fail
- ✅ **Auth Layer**: NextAuth configured correctly
- ✅ **API Routes**: Code is correct
- ✅ **Middleware**: Working properly
- ⚠️  **Worker**: May be affected by process locks

## 🛡️ **Prevention**

### Best Practices:

1. **Always Stop Cleanly**
   ```bash
   # Press Ctrl+C in each terminal
   # Wait for "Server closed"
   # Then close terminal
   ```

2. **Use Stop Script**
   ```bash
   .\stop-all.bat
   ```

3. **Check Before Starting**
   ```bash
   # Check for running processes
   tasklist | findstr "node.exe"
   
   # If found, stop them
   .\stop-all.bat
   ```

4. **Use Proper Shutdown**
   - Don't close terminals abruptly
   - Don't force-quit processes
   - Let servers shut down gracefully

5. **Regular Cleanup**
   ```bash
   # Weekly cleanup
   npm run clean-prisma
   npm install
   ```

## 🔧 **Additional Diagnostics**

### Check Specific Issues

**Database Connection:**
```bash
npx prisma studio
# Should open without errors
```

**Environment Variables:**
```bash
curl http://localhost:3000/api/test-env
```

**Process Status:**
```bash
tasklist | findstr "node.exe"
```

**File Locks (PowerShell):**
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "node"}
```

## 📁 **Key Files Analysis**

### 1. `src/lib/db.ts` ✅
- Correct Prisma singleton pattern
- No issues found

### 2. `src/auth.ts` ✅
- NextAuth v5 configured correctly
- Credentials provider working
- JWT strategy properly set up

### 3. `src/app/api/auth/register/route.ts` ✅
- Proper error handling
- Transaction usage correct
- No code issues

### 4. `src/middleware.ts` ✅
- Correct auth checking
- API routes excluded properly
- No blocking issues

### 5. `prisma/schema.prisma` ✅
- Schema is valid
- Relationships correct
- Generator configured

## 🚨 **Common Error Messages**

### "EPERM: operation not permitted"
**Cause:** File locked by running process  
**Fix:** Run `quick-fix.bat`

### "Can't reach database server"
**Cause:** PostgreSQL not running  
**Fix:** Start PostgreSQL service

### "Invalid prisma.*.* invocation"
**Cause:** Prisma client out of sync  
**Fix:** Run `npx prisma generate`

### "Module not found: @prisma/client"
**Cause:** Prisma not installed  
**Fix:** Run `npm install @prisma/client`

### "Error: No Prisma Client instance"
**Cause:** Prisma not generated  
**Fix:** Run `npx prisma generate`

## 📈 **Success Indicators**

You'll know it's fixed when:

- ✅ `npm run diagnose` shows all checks passing
- ✅ `npx prisma generate` completes without errors
- ✅ Dev server starts without warnings
- ✅ Can access `http://localhost:3000` without 500 error
- ✅ Can register a new user
- ✅ Can log in successfully
- ✅ Can view dashboard
- ✅ API routes return proper responses

## 📚 **Useful Commands**

```bash
# Diagnostics
npm run diagnose                    # Run full diagnostic check
npx prisma validate                 # Validate schema
npx prisma generate                 # Generate client
npx prisma db push                  # Push schema to DB
npx prisma studio                   # Open database GUI

# Cleanup
npm run clean-prisma                # Clean Prisma cache
.\stop-all.bat                      # Stop all Node processes
.\quick-fix.bat                     # Full automated fix

# Development
npm run dev                         # Start dev server
npm run worker                      # Start worker (separate terminal)
npm run dev:all                     # Start both (concurrently)

# Reset Everything
npm run reset                       # Clean, reinstall, regenerate
```

## 🆘 **If Still Having Issues**

1. **Restart Computer**
   - Sometimes required on Windows to release all file locks

2. **Check Antivirus**
   - Antivirus may be locking files
   - Add project folder to exclusions

3. **Check Disk Permissions**
   - Ensure write permissions on project folder
   - Run terminal as Administrator if needed

4. **Check PostgreSQL**
   ```bash
   # Check if PostgreSQL is running
   tasklist | findstr "postgres"
   ```

5. **Check Environment Variables**
   - Verify `.env.local` exists
   - Verify `DATABASE_URL` is correct
   - Verify all required vars are set

6. **Clean Node Modules**
   ```bash
   rmdir /s /q node_modules
   npm install
   npx prisma generate
   ```

## 📞 **Debug Mode**

For detailed logging:

```bash
# Set environment
set DEBUG=*

# Start with logging
npm run dev 2>&1 | tee debug.log
```

Check `debug.log` for specific error messages.

---

## Summary

**Problem:** Prisma query engine locked by multiple Node.js processes  
**Impact:** All database operations fail → 500 errors  
**Solution:** Kill processes, clean Prisma, regenerate client  
**Prevention:** Always stop processes cleanly, use stop scripts  

**Quick Fix:** Run `.\quick-fix.bat` and restart dev server

