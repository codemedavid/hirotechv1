# 🔧 Environment Variables Template

Copy this content to your `.env.local` file in the project root.

```env
# ==================================
# APPLICATION CONFIGURATION
# ==================================

# Your application URL (used for OAuth redirects and webhooks)
# Development: http://localhost:3000
# Production: https://your-domain.com
# Ngrok: https://your-subdomain.ngrok-free.app
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ==================================
# DATABASE CONFIGURATION
# ==================================

# PostgreSQL connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:password@localhost:5432/hiro

# ==================================
# NEXTAUTH CONFIGURATION
# ==================================

# NextAuth secret for JWT encryption
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32

# ==================================
# FACEBOOK API CONFIGURATION
# ==================================

# Facebook App credentials from developers.facebook.com
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Webhook verification token (create your own random string)
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your-custom-verification-token

# ==================================
# SUPABASE CONFIGURATION (if used)
# ==================================

# Supabase project URL and anonymous key
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# ==================================
# REDIS CONFIGURATION
# ==================================

# Redis connection URL for campaign processing and queues
# Development: redis://localhost:6379
# Production: Use your Redis provider URL (e.g., Upstash)
REDIS_URL=redis://localhost:6379

# ==================================
# ENVIRONMENT
# ==================================

# Application environment
# Options: development, production, test
NODE_ENV=development
```

---

## 📋 Setup Instructions

### 1. Create .env.local File

```bash
# In your project root directory
touch .env.local
```

Then copy the content above into the file.

### 2. Generate NEXTAUTH_SECRET

```bash
# On Linux/Mac/Git Bash
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output and replace `your-secret-here-generate-with-openssl-rand-base64-32`

### 3. Set Up Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app or select existing
3. Add **Messenger** product
4. Get your App ID and App Secret
5. Configure **OAuth Redirect URIs**:
   - `http://localhost:3000/api/facebook/callback`
   - `http://localhost:3000/api/facebook/callback-popup`
   - (Add your production/ngrok URLs when ready)
6. Configure **Webhook**:
   - Callback URL: `http://localhost:3000/api/webhooks/facebook`
   - Verify Token: (create your own secure random string)

### 4. Set Up Database

Ensure PostgreSQL is running and create your database:

```bash
# Create database
createdb hiro

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 5. Set Up Redis

**Option A: Local Redis**
```bash
# Install Redis
# Windows: Use redis-server folder in project or WSL
# Mac: brew install redis
# Linux: sudo apt-get install redis-server

# Start Redis
redis-server
```

**Option B: Cloud Redis (Upstash)**
1. Go to [Upstash](https://upstash.com)
2. Create a new Redis database
3. Copy the connection URL
4. Update `REDIS_URL` in .env.local

### 6. Verify Setup

```bash
# Check all environment variables are set
npm run dev
```

---

## ⚠️ Important Notes

### NEXTAUTH_SECRET
- **Required** for production
- **Must be kept secret** - never commit to version control
- Generate a new one for each environment (dev, staging, prod)
- Use at least 32 characters

### NEXT_PUBLIC_APP_URL
- **Critical for OAuth** - Facebook redirects use this
- Must match exactly with Facebook App settings
- Include protocol (http:// or https://)
- No trailing slash

### Facebook Credentials
- Keep App Secret **confidential**
- Use different apps for dev/production
- Verify redirect URIs match exactly

### Database
- Use different databases for dev/test/production
- Backup production database regularly
- Secure connection strings

### Redis
- Required for campaign processing
- Use persistent storage in production
- Consider Redis Cloud for production

---

## 🔒 Security Checklist

- [ ] .env.local is in .gitignore
- [ ] NEXTAUTH_SECRET is strong (32+ chars)
- [ ] Database credentials are secure
- [ ] Facebook App Secret is not exposed
- [ ] Redis is password-protected in production
- [ ] HTTPS is used in production

---

## 🐛 Troubleshooting

### "Invalid NEXTAUTH_SECRET"
- Ensure it's at least 32 characters
- No special characters that need escaping
- Regenerate with OpenSSL command

### Facebook OAuth Not Working
- Check NEXT_PUBLIC_APP_URL matches redirect URI
- Verify App ID and Secret are correct
- Ensure redirect URIs are added to Facebook App

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### Redis Connection Error
- Check Redis server is running
- Verify REDIS_URL format
- Test connection: `redis-cli ping`

---

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org)
- [Facebook Developers](https://developers.facebook.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Redis Documentation](https://redis.io/docs)

---

**Created:** November 11, 2025  
**Status:** ✅ Template Ready

