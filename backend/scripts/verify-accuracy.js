import { runAccuracyVerificationSuite } from '../services/accuracyService.js';

async function main() {
  console.log('\n================================================================');
  console.log('🛡️  INTEGRATED LOOKUP TOOLKIT — VERIFICATION & ACCURACY TEST SUITE');
  console.log('================================================================');
  console.log('Testing all lookup modules against ground-truth benchmarks...\n');

  try {
    const report = await runAccuracyVerificationSuite();

    console.table(report.tests.map((t, idx) => ({
      '#': idx + 1,
      'Module': t.module,
      'Test Target': t.target,
      'Status': t.passed ? '✓ PASSED' : '✗ FAILED',
      'Accuracy': `${t.accuracy}%`,
      'Latency': `${t.latencyMs}ms`,
      'Verified Output': t.actual.length > 50 ? t.actual.substring(0, 47) + '...' : t.actual
    })));

    console.log('\n----------------------------------------------------------------');
    console.log(`📊 ACCURACY PERCENTAGE: ${report.accuracyPercentage}% (${report.grade} - ${report.statusText})`);
    console.log(`⏱️  Total Duration     : ${report.metrics.totalDurationMs}ms (Avg: ${report.metrics.averageLatencyMs}ms/test)`);
    console.log(`✅ Tests Passed       : ${report.metrics.passedTests} / ${report.metrics.totalTests}`);
    console.log(`🕒 Verified At        : ${report.verifiedAt}`);
    console.log('================================================================\n');

    if (report.accuracyPercentage < 80) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Accuracy test suite encountered a fatal error:', err);
    process.exit(1);
  }
}

main();
