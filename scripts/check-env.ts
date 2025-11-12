console.log('\n🔍 Environment Variables Check\n');
console.log('='.repeat(50));

const requiredEnvVars = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
  'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
  'NODE_ENV': process.env.NODE_ENV,
};

const optionalEnvVars = {
  'FACEBOOK_APP_ID': process.env.FACEBOOK_APP_ID,
  'FACEBOOK_APP_SECRET': process.env.FACEBOOK_APP_SECRET,
  'REDIS_URL': process.env.REDIS_URL,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
};

console.log('\n✅ Required Variables:\n');
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const display = value 
    ? (key.includes('SECRET') || key.includes('PASSWORD') 
        ? `${value.substring(0, 10)}...` 
        : value)
    : 'NOT SET';
  console.log(`${status} ${key}: ${display}`);
});

console.log('\n📋 Optional Variables:\n');
Object.entries(optionalEnvVars).forEach(([key, value]) => {
  const status = value ? '✅' : '⚠️ ';
  const display = value 
    ? (key.includes('SECRET') || key.includes('KEY') 
        ? `${value.substring(0, 10)}...` 
        : value)
    : 'Not set';
  console.log(`${status} ${key}: ${display}`);
});

console.log('\n' + '='.repeat(50));

// Check for issues
const issues = [];
if (!requiredEnvVars.DATABASE_URL) issues.push('DATABASE_URL is missing');
if (!requiredEnvVars.NEXTAUTH_SECRET) issues.push('NEXTAUTH_SECRET is missing');
if (!requiredEnvVars.NEXTAUTH_URL) issues.push('NEXTAUTH_URL is missing');

if (issues.length > 0) {
  console.log('\n❌ Issues Found:\n');
  issues.forEach(issue => console.log(`   - ${issue}`));
  console.log('\n💡 Add missing variables to .env.local file\n');
} else {
  console.log('\n✅ All required environment variables are set!\n');
}

