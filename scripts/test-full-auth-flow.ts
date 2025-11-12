import { prisma } from '../src/lib/db';
import bcrypt from 'bcrypt';

async function testFullAuthFlow() {
  console.log('\n🔐 Complete Authentication Flow Test\n');
  console.log('='.repeat(60));

  try {
    // Test credentials
    const testEmail = 'admin@admin.com';
    const testPassword = 'admin1234';

    console.log('\n1️⃣  Testing Database Connection...');
    await prisma.$connect();
    console.log('   ✅ Connected to database');

    console.log('\n2️⃣  Fetching user from database...');
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        organization: true,
      },
    });

    if (!user) {
      console.log('   ❌ User not found!');
      return;
    }

    console.log('   ✅ User found:');
    console.log(`      - Email: ${user.email}`);
    console.log(`      - Name: ${user.name}`);
    console.log(`      - Role: ${user.role}`);
    console.log(`      - Organization: ${user.organization.name}`);
    console.log(`      - Organization ID: ${user.organizationId}`);

    console.log('\n3️⃣  Checking password field...');
    if (!user.password) {
      console.log('   ❌ User has no password!');
      return;
    }
    console.log('   ✅ Password hash exists');
    console.log(`      - Hash length: ${user.password.length} chars`);
    console.log(`      - Hash format: ${user.password.substring(0, 4)}...`);

    console.log('\n4️⃣  Verifying password...');
    const isPasswordCorrect = await bcrypt.compare(testPassword, user.password);
    
    if (!isPasswordCorrect) {
      console.log('   ❌ Password does not match!');
      console.log('   💡 The password might be different');
      return;
    }

    console.log('   ✅ Password is correct!');

    console.log('\n5️⃣  Simulating NextAuth authorize function...');
    // This is what NextAuth does in auth.ts
    const authorizeResult = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      image: user.image || undefined,
      role: user.role,
      organizationId: user.organizationId,
    };

    console.log('   ✅ Authorization would succeed');
    console.log('   📦 User object to be returned:');
    console.log(JSON.stringify(authorizeResult, null, 2));

    console.log('\n6️⃣  Checking all required fields...');
    const requiredFields = ['id', 'email', 'role', 'organizationId'];
    const missingFields = requiredFields.filter(field => !authorizeResult[field as keyof typeof authorizeResult]);
    
    if (missingFields.length > 0) {
      console.log(`   ⚠️  Missing fields: ${missingFields.join(', ')}`);
    } else {
      console.log('   ✅ All required fields present');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Authentication Flow Test: PASSED\n');

    console.log('📋 Login Instructions:\n');
    console.log('1. Open your browser to: http://localhost:3000/login');
    console.log(`2. Email: ${testEmail}`);
    console.log(`3. Password: ${testPassword}`);
    console.log('4. Click "Sign in"\n');

    console.log('🔍 If login still shows "Invalid email or password":\n');
    console.log('Possible causes:');
    console.log('   a) Browser is caching old errors - try Incognito mode');
    console.log('   b) Session cookie not being set - check browser cookies');
    console.log('   c) NEXTAUTH_SECRET mismatch - restart dev server');
    console.log('   d) Check dev server terminal for [Auth] logs\n');

    console.log('📊 What the logs should show:');
    console.log('   [Auth] Attempting login for: admin@admin.com');
    console.log('   [Auth] Comparing passwords...');
    console.log('   [Auth] Login successful for: admin@admin.com');
    console.log('   [Login] Success! Redirecting...\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFullAuthFlow();

