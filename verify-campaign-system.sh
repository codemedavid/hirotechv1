#!/bin/bash

# Campaign System Verification Script
# Run this anytime to check if everything is working

echo "🔍 Checking Campaign System Status..."
echo ""

# Check Redis
echo "1️⃣ Checking Redis Server..."
if redis-server/redis-cli.exe ping > /dev/null 2>&1; then
    echo "   ✅ Redis is running"
    redis-server/redis-cli.exe INFO server | grep "redis_version"
else
    echo "   ❌ Redis is NOT running"
    echo "   Fix: redis-server/redis-server.exe &"
fi
echo ""

# Check Environment
echo "2️⃣ Checking Environment Configuration..."
if [ -f .env.local ]; then
    echo "   ✅ .env.local exists"
    if grep -q "REDIS_URL" .env.local; then
        echo "   ✅ REDIS_URL is configured"
        grep "REDIS_URL" .env.local | grep -v "#"
    else
        echo "   ❌ REDIS_URL not found in .env.local"
    fi
else
    echo "   ❌ .env.local file missing"
fi
echo ""

# Check Worker Process
echo "3️⃣ Checking Worker Process..."
if ps aux | grep -E "(tsx.*worker|node.*worker)" | grep -v grep > /dev/null; then
    echo "   ✅ Worker process is running"
    ps aux | grep -E "(tsx.*worker|node.*worker)" | grep -v grep | head -1
else
    echo "   ⚠️  Worker may not be running"
    echo "   Fix: npm run worker"
fi
echo ""

# Check Redis Stats
echo "4️⃣ Checking Redis Activity..."
if redis-server/redis-cli.exe ping > /dev/null 2>&1; then
    echo "   Redis Statistics:"
    redis-server/redis-cli.exe INFO stats | grep -E "(total_connections_received|total_commands_processed)"
else
    echo "   ❌ Cannot check stats (Redis not running)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ALL_GOOD=true

if ! redis-server/redis-cli.exe ping > /dev/null 2>&1; then
    ALL_GOOD=false
    echo "❌ Redis needs to be started"
fi

if [ ! -f .env.local ] || ! grep -q "REDIS_URL" .env.local; then
    ALL_GOOD=false
    echo "❌ Environment needs configuration"
fi

if ! ps aux | grep -E "(tsx.*worker|node.*worker)" | grep -v grep > /dev/null; then
    echo "⚠️  Worker may need to be started"
fi

if [ "$ALL_GOOD" = true ]; then
    echo ""
    echo "✅ All systems operational!"
    echo "🚀 Ready to send campaigns!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 For help, check:"
echo "   - CAMPAIGN_WORKER_STATUS.md"
echo "   - QUICK_CAMPAIGN_START.md"
echo ""

