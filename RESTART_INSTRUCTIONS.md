# 🔄 How to Fix the Edge Runtime Error

## The Problem
You're still seeing the edge runtime error because the dev server is using **cached** edge chunks that contain the old middleware code.

## The Solution

### Step 1: Stop Dev Server
In your terminal where `npm run dev` is running:
- Press `Ctrl+C` to stop it

### Step 2: Clear Next.js Cache
Run this command:
```bash
rm -rf .next
# Or on Windows PowerShell:
Remove-Item -Recurse -Force .next
# Or manually delete the .next folder
```

### Step 3: Start Fresh
```bash
npm run dev
```

### Step 4: Test Registration
Open http://localhost:3000/register and try creating an account.

---

## Why This Happens

Next.js Turbopack caches compiled edge runtime code in `.next/dev/server/edge/chunks/`. 

When we updated the middleware, the cache still had the old version that uses `auth()` function, which causes the edge runtime error.

Clearing `.next` forces Next.js to recompile everything with the new middleware code.

---

## What Should Work After Cache Clear

✅ No edge runtime errors  
✅ Middleware works with simple cookie check  
✅ Registration API accessible  
✅ Can create accounts (if database is connected)  

---

## If Error Persists After Cache Clear

The error might be coming from somewhere else. Check:

1. **Is there another file using edge runtime?**
   ```bash
   grep -r "export const runtime = 'edge'" src/
   ```

2. **Any API routes with edge config?**
   ```bash
   grep -r "export const config.*runtime.*edge" src/app/api/
   ```

3. **Check if auth.ts is being imported in middleware:**
   The new middleware shouldn't import from `./auth` at all.

---

## Alternative: Disable Turbopack (If Cache Clear Doesn't Work)

If clearing cache doesn't fix it, you can run without Turbopack:

```bash
# Stop dev server
# Then start with:
npm run dev -- --no-turbopack
```

This uses the traditional webpack bundler which doesn't have this edge runtime bug.

---

## Quick Command Reference

```bash
# Stop server: Ctrl+C

# Clear cache
rm -rf .next

# Start server
npm run dev

# Or start without Turbopack
npm run dev -- --no-turbopack
```

---

**After these steps, registration should work!** 🚀

