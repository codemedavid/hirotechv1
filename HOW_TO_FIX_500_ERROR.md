# 🚨 HOW TO FIX 500 INTERNAL SERVER ERROR

## ⚡ QUICK FIX (30 seconds)

```bash
# Run this one command
.\quick-fix.bat
```

Then restart your dev server:

```bash
npm run dev
```

**Done!** ✅

---

## 🔍 What Caused It?

**Problem:** Multiple Node.js processes locked the Prisma database engine file

**Why:** Terminals were closed without properly stopping servers (Ctrl+C)

**Result:** All database operations fail → 500 errors everywhere

---

## 📋 Step-by-Step Manual Fix

If the quick fix doesn't work:

### Step 1: Kill All Node Processes
```bash
taskkill /F /IM node.exe /T
```

### Step 2: Clean Prisma
```bash
npm run clean-prisma
```

### Step 3: Reinstall Prisma
```bash
npm install
npx prisma generate
```

### Step 4: Start Server
```bash
npm run dev
```

---

## 🧪 How to Verify It's Fixed

### 1. Run Diagnostics
```bash
npm run diagnose
```

Should show all checks passing ✅

### 2. Test Prisma
```bash
npx prisma studio
```

Should open without errors ✅

### 3. Test Application
- Visit: http://localhost:3000
- Should load without 500 error ✅
- Try registering a new account ✅
- Try logging in ✅

---

## 🛡️ How to Prevent This

### ✅ DO:
- Always press **Ctrl+C** to stop servers
- Wait for "Server closed" message
- Use `.\stop-all.bat` before closing terminals
- Run `npm run diagnose` if something feels wrong

### ❌ DON'T:
- Close terminals without stopping servers
- Run multiple dev servers at once
- Force-quit processes
- Ignore "port in use" warnings

---

## 🆘 Still Not Working?

### Check These:

1. **Is PostgreSQL running?**
   ```bash
   tasklist | findstr "postgres"
   ```

2. **Is .env.local configured?**
   - Must have `DATABASE_URL`
   - Must have `NEXTAUTH_SECRET`
   - Must have other required vars

3. **Are node_modules corrupt?**
   ```bash
   rm -rf node_modules
   npm install
   ```

4. **Try full reset:**
   ```bash
   npm run reset
   ```

---

## 📚 More Help

- **Detailed Guide:** `FIX_INTERNAL_SERVER_ERROR.md`
- **Full Analysis:** `DIAGNOSIS_SUMMARY.md`
- **All Issues:** `TROUBLESHOOTING.md`

---

## 🎯 Summary

**Problem:** Prisma file locked → Database fails → 500 errors  
**Fix:** Kill processes → Clean Prisma → Regenerate → Restart  
**Prevention:** Always use Ctrl+C, use stop-all.bat, run diagnostics  

**Quick Command:** `.\quick-fix.bat`

