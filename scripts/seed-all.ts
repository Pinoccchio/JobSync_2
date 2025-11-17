/**
 * Master Seed Script
 * Runs all seed scripts in sequence:
 * 1. Create 50 complete test users with auth, profiles, and PDS
 * 2. Enroll all users in active/upcoming training programs
 */

import { spawn } from 'child_process';
import { join } from 'path';

const scripts = [
  {
    name: 'Create 50 Complete Users',
    file: 'seed-50-complete-users.ts',
    description: 'Creates test users with auth, profiles, and complete PDS records'
  },
  {
    name: 'Create Training Applications',
    file: 'seed-training-applications.ts',
    description: 'Enrolls all test users in active/upcoming training programs'
  }
];

/**
 * Run a TypeScript script using ts-node
 */
function runScript(scriptPath: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    console.log(`\n🚀 Running: ${scriptPath}\n`);

    const child = spawn('npx', ['ts-node', scriptPath], {
      stdio: 'inherit',
      shell: true,
      cwd: join(__dirname, '..')
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: '' });
      } else {
        resolve({ success: false, output: `Script exited with code ${code}` });
      }
    });

    child.on('error', (error) => {
      resolve({ success: false, output: error.message });
    });
  });
}

/**
 * Main execution function
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                 JOBSYNC COMPLETE SEED SUITE                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Seed Plan:');
  scripts.forEach((script, index) => {
    console.log(`  ${index + 1}. ${script.name}`);
    console.log(`     ${script.description}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');

  const startTime = Date.now();
  const results: { name: string; success: boolean; error?: string }[] = [];

  // Run scripts sequentially
  for (const script of scripts) {
    const scriptPath = join(__dirname, script.file);
    const result = await runScript(scriptPath);

    results.push({
      name: script.name,
      success: result.success,
      error: result.success ? undefined : result.output
    });

    if (!result.success) {
      console.error(`\n❌ ${script.name} failed: ${result.output}`);
      console.log('\n⚠️  Stopping seed process due to error.\n');
      break;
    }

    console.log(`\n✅ ${script.name} completed successfully!\n`);

    // Small delay between scripts
    if (script !== scripts[scripts.length - 1]) {
      console.log('⏳ Waiting 2 seconds before next script...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 FINAL SUMMARY\n');

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`  ${icon} ${index + 1}. ${result.name}`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`\n  Total: ${successCount}/${results.length} scripts completed`);
  console.log(`  Time: ${duration} minutes\n`);

  if (failCount === 0) {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║              🎉 ALL SEEDS COMPLETED SUCCESSFULLY! 🎉          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('📝 What was created:');
    console.log('  ✅ 50 test applicant users with auth accounts');
    console.log('  ✅ 50 complete PDS records (100% completion)');
    console.log('  ✅ ~2,400 pending training applications');
    console.log('  ✅ All data relationships properly established\n');

    console.log('🔑 Test Credentials:');
    console.log('  Email: test.applicant.01@jobsync.test (through .50)');
    console.log('  Password: TestPass123\n');

    console.log('🎯 Next Steps:');
    console.log('  1. Visit http://localhost:3000/peso/dashboard');
    console.log('  2. Test bulk approval/denial workflows');
    console.log('  3. Test attendance marking');
    console.log('  4. Test certificate generation');
    console.log('  5. Verify data in Supabase dashboard\n');

    console.log('🧹 To remove all test data:');
    console.log('  npm run seed:cleanup\n');
  } else {
    console.log('⚠️  Some scripts failed. Please check the errors above.\n');
  }
}

// Execute
main().catch(console.error);
