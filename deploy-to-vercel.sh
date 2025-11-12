#!/bin/bash

# Deployment Script for Hiro Messenger Platform
# This script automates the deployment process to Vercel

echo "════════════════════════════════════════════════"
echo "   🚀 HIRO DEPLOYMENT SCRIPT"
echo "════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Verify we're in the right directory
echo -e "${BLUE}Step 1: Verifying project directory...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Project directory verified${NC}"
echo ""

# Step 2: Check if Vercel CLI is installed
echo -e "${BLUE}Step 2: Checking Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install Vercel CLI${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
else
    echo -e "${GREEN}✅ Vercel CLI already installed${NC}"
fi
echo ""

# Step 3: Run final build test
echo -e "${BLUE}Step 3: Running final build test...${NC}"
npm run build > build-test.log 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Please check build-test.log for errors${NC}"
    tail -20 build-test.log
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Step 4: Verify environment variables
echo -e "${BLUE}Step 4: Checking environment variables...${NC}"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local found${NC}"
    
    # Check for required variables
    required_vars=("DATABASE_URL" "REDIS_URL" "NEXTAUTH_URL" "NEXTAUTH_SECRET" "FACEBOOK_APP_ID" "FACEBOOK_APP_SECRET")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env.local; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ All required environment variables present${NC}"
    else
        echo -e "${YELLOW}⚠️  Missing variables: ${missing_vars[*]}${NC}"
        echo -e "${YELLOW}   You'll need to add these in Vercel dashboard after deployment${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    echo -e "${YELLOW}   You'll need to add environment variables in Vercel dashboard${NC}"
fi
echo ""

# Step 5: Check if user is logged in to Vercel
echo -e "${BLUE}Step 5: Checking Vercel login status...${NC}"
vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel${NC}"
    echo -e "${BLUE}Please login to Vercel:${NC}"
    vercel login
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Vercel login failed${NC}"
        exit 1
    fi
fi
VERCEL_USER=$(vercel whoami 2>/dev/null)
echo -e "${GREEN}✅ Logged in as: ${VERCEL_USER}${NC}"
echo ""

# Step 6: Ask user for deployment type
echo -e "${BLUE}Step 6: Choose deployment type${NC}"
echo "1) Preview deployment (test before production)"
echo "2) Production deployment"
echo ""
read -p "Enter choice (1 or 2): " choice

echo ""
case $choice in
    1)
        echo -e "${BLUE}Deploying to preview...${NC}"
        vercel
        ;;
    2)
        echo -e "${BLUE}Deploying to production...${NC}"
        echo -e "${RED}⚠️  WARNING: This will deploy to production!${NC}"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" == "yes" ]; then
            vercel --prod
        else
            echo -e "${YELLOW}Deployment cancelled${NC}"
            exit 0
        fi
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════"
echo -e "${GREEN}   ✅ DEPLOYMENT INITIATED!${NC}"
echo "════════════════════════════════════════════════"
echo ""
echo "📝 NEXT STEPS:"
echo ""
echo "1. After deployment, Vercel will provide a URL"
echo "2. Go to Vercel dashboard: https://vercel.com/dashboard"
echo "3. Add environment variables:"
echo "   - DATABASE_URL"
echo "   - REDIS_URL"
echo "   - NEXTAUTH_URL (set to your Vercel URL)"
echo "   - NEXTAUTH_SECRET"
echo "   - FACEBOOK_APP_ID"
echo "   - FACEBOOK_APP_SECRET"
echo "   - NEXT_PUBLIC_APP_URL (set to your Vercel URL)"
echo ""
echo "4. Update Facebook App settings:"
echo "   - OAuth Redirect URIs:"
echo "     • https://your-domain.vercel.app/api/facebook/callback"
echo "     • https://your-domain.vercel.app/api/facebook/callback-popup"
echo "   - Webhook URL:"
echo "     • https://your-domain.vercel.app/api/webhooks/facebook"
echo ""
echo "5. Redeploy after adding environment variables:"
echo "   vercel --prod"
echo ""
echo "════════════════════════════════════════════════"

