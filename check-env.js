#!/usr/bin/env node

/**
 * Simple script to check if all required environment variables are set
 * Run with: node check-env.js
 */

const requiredVars = [
  'TALENT_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const optionalVars = [
  'SYNC_API_KEY'
];

console.log('🔍 Checking environment variables...\n');

let allGood = true;

// Check required variables
console.log('Required variables:');
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
    allGood = false;
  }
}

// Check optional variables
console.log('\nOptional variables:');
for (const varName of optionalVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ⚠️  ${varName}: NOT SET (optional)`);
  }
}

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('✅ All required environment variables are set!');
  console.log('\nYou can now run:');
  console.log('  • npm run sync    - to populate the database');
  console.log('  • npm run dev     - to start the dev server');
  process.exit(0);
} else {
  console.log('❌ Some required environment variables are missing!');
  console.log('\nPlease create a .env.local file with:');
  console.log('  TALENT_API_KEY=your_key');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.log('\nSee QUICKSTART.md for detailed instructions.');
  process.exit(1);
}
