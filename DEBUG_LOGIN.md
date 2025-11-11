# 🔍 Debugging Login Issue

## Error You're Seeing
```
[auth][error] CredentialsSignin
```

This means the `authorize` function returned `null`, rejecting the login.

## What I Added
Debug logging to the authorize function to see exactly where it's failing:

1. ✅ Credentials received?
2. ✅ User found in database?
3. ✅ User has password?
4. ✅ Password comparison result?

## How to Debug

### Step 1: Try Logging In Again
1. Go to http://localhost:3000/login
2. Enter the email and password you used during registration
3. Click "Sign in"

### Step 2: Check Your Dev Server Terminal
Look for these log messages:
```
[Auth] Attempting login for: your@email.com
[Auth] User not found: your@email.com       ← User doesn't exist
[Auth] User has no password: your@email.com ← Password field is empty
[Auth] Password mismatch for: your@email.com ← Wrong password
[Auth] Login successful for: your@email.com  ← Should work!
```

### Step 3: Tell Me What You See
The logs will tell us exactly what's wrong:

- **"User not found"** → Registration might have failed silently
- **"User has no password"** → Password wasn't saved
- **"Password mismatch"** → Password comparison failing (bcrypt issue)
- **"Login successful"** → It worked!

## Common Issues

### Issue 1: Email Case Sensitivity
If you registered with `John@Example.com` but logging in with `john@example.com`, it won't match.

**Fix**: Make sure email case matches exactly.

### Issue 2: Password Has Extra Spaces
If you copied/pasted the password, there might be trailing spaces.

**Fix**: Type the password manually.

### Issue 3: User Wasn't Actually Created
The registration might have appeared to work but didn't save to database.

**Fix**: Check database with:
```bash
npx prisma studio
```
Look in the `User` table - is your user there?

## Next Steps

1. **Try logging in again**
2. **Copy the log output from your terminal**
3. **Tell me what the logs say**

This will tell us exactly what's failing!

