import { prisma } from '../src/lib/db';
import bcrypt from 'bcrypt';

async function testAuth() {
  console.log('\n🔍 Authentication System Diagnostic\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Database Connection
    console.log('\n1️⃣  Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connected successfully');

    // Test 2: Check if User table exists
    console.log('\n2️⃣  Checking User table...');
    const userCount = await prisma.user.count();
    console.log(`   ✅ User table exists (${userCount} users found)`);

    // Test 3: List all users (without showing passwords)
    console.log('\n3️⃣  Listing users in database:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true, // We need to check if password exists
        organizationId: true,
      },
    });

    if (users.length === 0) {
      console.log('   ⚠️  No users found in database!');
      console.log('   💡 You need to register a user first');
    } else {
      users.forEach((user, index) => {
        console.log(`\n   User ${index + 1}:`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Name: ${user.name || 'N/A'}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Has Password: ${user.password ? '✅ YES' : '❌ NO'}`);
        console.log(`   - Password Hash Length: ${user.password?.length || 0} chars`);
        console.log(`   - Organization ID: ${user.organizationId}`);
      });
    }

    // Test 4: Check Organizations
    console.log('\n4️⃣  Checking Organizations...');
    const orgCount = await prisma.organization.count();
    console.log(`   ✅ Found ${orgCount} organization(s)`);

    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    orgs.forEach((org, index) => {
      console.log(`   Org ${index + 1}: ${org.name} (${org.slug})`);
    });

    // Test 5: Test Password Hashing
    console.log('\n5️⃣  Testing bcrypt functionality...');
    const testPassword = 'testpassword123';
    const hash = await bcrypt.hash(testPassword, 10);
    const isValid = await bcrypt.compare(testPassword, hash);
    console.log(`   ✅ bcrypt is working correctly: ${isValid}`);

    // Test 6: Test a specific user's password (if any exist)
    if (users.length > 0 && users[0].password) {
      console.log('\n6️⃣  Testing password verification for first user...');
      console.log('   💡 To test login, you need to know the original password');
      console.log('   💡 The password was set during registration');
      
      // Check if the password hash looks valid
      const passwordHash = users[0].password;
      const isBcryptHash = passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$');
      console.log(`   - Hash format valid: ${isBcryptHash ? '✅ YES' : '❌ NO'}`);
      
      if (!isBcryptHash) {
        console.log('   ⚠️  WARNING: Password hash format is invalid!');
        console.log('   💡 This means passwords were not hashed correctly during registration');
      }
    }

    // Test 7: Environment Variables
    console.log('\n7️⃣  Checking environment variables...');
    const envVars = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV,
    };
    
    Object.entries(envVars).forEach(([key, value]) => {
      const status = typeof value === 'boolean' 
        ? (value ? '✅ Set' : '❌ Missing')
        : `✅ ${value}`;
      console.log(`   - ${key}: ${status}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Diagnostic complete!\n');

    // Summary
    console.log('📊 Summary:');
    console.log(`   - Users in database: ${userCount}`);
    console.log(`   - Organizations: ${orgCount}`);
    console.log(`   - Database connection: ✅ Working`);
    console.log(`   - bcrypt: ✅ Working`);
    
    if (userCount === 0) {
      console.log('\n💡 NEXT STEP: Register a user at /register');
    } else if (users[0].password && !users[0].password.startsWith('$2')) {
      console.log('\n⚠️  ISSUE FOUND: Passwords are not properly hashed!');
      console.log('💡 FIX: Check registration code in /api/auth/register/route.ts');
    } else {
      console.log('\n✅ Everything looks good!');
      console.log('💡 If login is failing, ensure you\'re using the correct email/password');
      console.log(`💡 Try logging in with: ${users[0].email}`);
    }

  } catch (error) {
    console.error('\n❌ Error during diagnostic:');
    console.error(error);
    
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        console.log('\n💡 Database connection issue detected');
        console.log('   - Check if DATABASE_URL is correct in .env.local');
        console.log('   - Ensure database server is running');
        console.log('   - Check network connectivity');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();

