# Fix for Internal Server Error - Prisma Client Lock Issue

## 🔴 Problem Identified

Your application is experiencing **500 Internal Server Errors** because:

1. **Prisma query engine is locked** by running Node.js processes
2. Multiple Node.js processes (7 found) are holding file locks
3. Cannot regenerate Prisma client, causing all database operations to fail

## ✅ Solution Steps

### Step 1: Kill All Node.js Processes

Open PowerShell or Command Prompt as Administrator and run:

```powershell
# Kill all Node.js processes
taskkill /F /IM node.exe /T
```

**Alternative**: Close all running terminals and restart your computer if the above doesn't work.

### Step 2: Clean Prisma Client

```bash
# Remove the locked Prisma client
npm run clean-prisma
```

Or manually:

```bash
# Remove node_modules/.prisma
rmdir /s /q node_modules\.prisma
rmdir /s /q node_modules\@prisma
```

### Step 3: Reinstall and Regenerate

```bash
# Reinstall Prisma
npm install --force

# Regenerate Prisma client
npx prisma generate

# Push schema to database (if needed)
npx prisma db push
```

### Step 4: Restart Application Properly

**Option A: Start Both Services Separately**

Terminal 1:
```bash
npm run dev
```

Terminal 2:
```bash
npm run worker
```

**Option B: Start Everything Together**

```bash
npm run dev:all
```

## 🔍 How to Prevent This Issue

### 1. Always Stop Processes Cleanly

**DO THIS:**
- Press `Ctrl+C` in each terminal
- Wait for graceful shutdown
- Close terminals properly

**DON'T DO THIS:**
- Close terminal windows abruptly
- Kill processes without cleanup
- Run multiple dev servers simultaneously

### 2. Use Process Manager Script

Create `stop-all.bat`:

```batch
@echo off
echo Stopping all Node processes...
taskkill /F /IM node.exe /T
echo Done!
pause
```

Run this before starting development if you suspect locked processes.

### 3. Check for Running Processes

Before starting dev server:

```bash
# Check if Node is running
tasklist | grep node

# Or in PowerShell
Get-Process node -ErrorAction SilentlyContinue
```

## 🧪 Verify the Fix

After following the steps above, test these endpoints:

### 1. Test Environment Variables
```bash
curl http://localhost:3000/api/test-env
```

### 2. Test Registration
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

### 3. Test Login
Visit `http://localhost:3000/login` and try logging in.

## 🚨 If Still Getting Errors

### Check Database Connection

```bash
# Test database connection
npx prisma studio
```

If Prisma Studio opens successfully, database is working.

### Check Environment Variables

Ensure `.env.local` exists with:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
NEXTAUTH_SECRET="your-secret-min-32-chars"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
FACEBOOK_APP_ID="your-app-id"
FACEBOOK_APP_SECRET="your-app-secret"
REDIS_URL="redis://localhost:6379"
```

### Check Logs

Look for specific errors:

```bash
# Start dev server with full logs
npm run dev 2>&1 | tee dev.log
```

## 📋 Common Error Messages & Fixes

### Error: "EPERM: operation not permitted"
**Fix:** Kill all Node processes and regenerate Prisma

### Error: "Can't reach database server"
**Fix:** Check DATABASE_URL and ensure PostgreSQL is running

### Error: "Invalid `prisma.user.findUnique()` invocation"
**Fix:** Run `npx prisma generate` and restart

### Error: "Module not found: Can't resolve '@prisma/client'"
**Fix:** Run `npm install @prisma/client` and `npx prisma generate`

## 🎯 Quick Recovery Script

Create `quick-fix.bat`:

```batch
@echo off
echo === Quick Fix for Internal Server Error ===
echo.
echo Step 1: Killing all Node processes...
taskkill /F /IM node.exe /T 2>nul
echo.
echo Step 2: Cleaning Prisma client...
if exist "node_modules\.prisma" rmdir /s /q "node_modules\.prisma"
echo.
echo Step 3: Regenerating Prisma client...
call npx prisma generate
echo.
echo Step 4: Starting development server...
echo.
echo === Fix Complete! ===
echo You can now run: npm run dev
pause
```

## ✅ Success Indicators

You'll know it's fixed when:

- ✅ `npx prisma generate` completes without errors
- ✅ Dev server starts without warnings
- ✅ Can access `http://localhost:3000`
- ✅ Login page loads without 500 error
- ✅ Can register a new user
- ✅ Can log in successfully

## 🆘 Still Need Help?

Check these specific files for errors:

1. **Authentication**: `src/auth.ts`
2. **Database Connection**: `src/lib/db.ts`
3. **Registration Route**: `src/app/api/auth/register/route.ts`
4. **Middleware**: `src/middleware.ts`

Run with debug mode:

```bash
DEBUG=* npm run dev
```

