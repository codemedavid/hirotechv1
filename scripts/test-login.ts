import { prisma } from '../src/lib/db';
import bcrypt from 'bcrypt';

async function testLogin() {
  console.log('\n🔐 Login Flow Test\n');
  console.log('='.repeat(50));

  try {
    // Get a test user
    console.log('\n1️⃣  Fetching test user...');
    const testEmail = 'admin@admin.com'; // From diagnostic results
    
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { organization: true },
    });

    if (!user) {
      console.log(`   ❌ User not found: ${testEmail}`);
      return;
    }

    console.log(`   ✅ Found user: ${user.email}`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Organization: ${user.organization.name}`);

    // Test password comparison with common passwords
    console.log('\n2️⃣  Testing common passwords...');
    const testPasswords = [
      'admin',
      'admin123',
      'admin1234',
      'password',
      'password123',
      'Admin123',
      '123456',
    ];

    if (!user.password) {
      console.log('   ❌ User has no password set!');
      return;
    }

    let foundPassword = false;
    for (const testPassword of testPasswords) {
      const isMatch = await bcrypt.compare(testPassword, user.password);
      if (isMatch) {
        console.log(`   ✅ FOUND! Password is: "${testPassword}"`);
        foundPassword = true;
        break;
      }
    }

    if (!foundPassword) {
      console.log('   ⚠️  None of the common passwords matched');
      console.log('   💡 The password is custom - check your registration data');
    }

    // Check the second user too
    console.log('\n3️⃣  Checking second user (admin1@admin.com)...');
    const user2 = await prisma.user.findUnique({
      where: { email: 'admin1@admin.com' },
    });

    if (user2 && user2.password) {
      console.log('   Testing common passwords for admin1@admin.com...');
      for (const testPassword of testPasswords) {
        const isMatch = await bcrypt.compare(testPassword, user2.password);
        if (isMatch) {
          console.log(`   ✅ FOUND! Password is: "${testPassword}"`);
          foundPassword = true;
          break;
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n📋 Login Instructions:\n');
    console.log('1. Go to: http://localhost:3000/login');
    console.log(`2. Email: ${testEmail}`);
    if (foundPassword) {
      console.log('3. Password: (see above)');
    } else {
      console.log('3. Password: Use the password you set during registration');
    }
    console.log('\n4. Click "Sign in"');
    console.log('\n5. Check your browser console and terminal logs for detailed debugging');

    console.log('\n💡 If login still fails, check:');
    console.log('   - Browser console for errors (F12)');
    console.log('   - Dev server terminal for [Auth] logs');
    console.log('   - Network tab for failed requests');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();

