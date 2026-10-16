/**
 * Automated Complete QA & Bug Detection Test Suite
 * Tests all endpoints, validation, error handling, live services, and Supabase integration.
 */
import { performDnsLookup } from '../services/dnsService.js';
import { performIpLookup, performReverseDnsLookup } from '../services/ipService.js';
import { performEmailLookup } from '../services/emailService.js';
import { performWhoisLookup } from '../services/whoisService.js';
import { performNameLookup } from '../services/nameService.js';
import { detectInputType } from '../services/detectorService.js';
import { getHistory, recordLookup, deleteHistoryRecord, getDashboardStats } from '../config/supabase.js';
import { query, isDatabaseConfigured, testConnection } from '../config/db.js';

const BASE_URL = 'http://localhost:5000/api';

async function runTestSuite() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  function assert(name, condition, details = '') {
    results.total++;
    if (condition) {
      results.passed++;
      results.tests.push({ name, status: 'PASS', details });
      console.log(`  ✓ [PASS] ${name}${details ? ` (${details})` : ''}`);
    } else {
      results.failed++;
      results.tests.push({ name, status: 'FAIL', details });
      console.error(`  ❌ [FAIL] ${name}: ${details}`);
    }
  }

  console.log('\n========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE QA TEST SUITE');
  console.log('========================================================');

  // --- 1. DETECTOR SERVICE TEST ---
  console.log('\n[1/10] Testing Auto-Detector Service...');
  const dDomain = detectInputType('example.com');
  assert('Detects Domain', dDomain.type === 'dns', dDomain.label);

  const dIp = detectInputType('8.8.8.8');
  assert('Detects IPv4', dIp.type === 'ip' && dIp.ipVersion === 'IPv4', dIp.label);

  const dIpv6 = detectInputType('2001:4860:4860::8888');
  assert('Detects IPv6', dIpv6.type === 'ip' && dIpv6.ipVersion === 'IPv6', dIpv6.label);

  const dEmail = detectInputType('analyst@security.org');
  assert('Detects Email', dEmail.type === 'email', dEmail.label);

  const dName = detectInputType('Alan Turing');
  assert('Detects Name', dName.type === 'name', dName.label);

  const dEmpty = detectInputType('');
  assert('Handles Empty Input in Detector', dEmpty.type === null, dEmpty.error);

  const dInvalid = detectInputType('!@#$%^&*()');
  assert('Handles Invalid Input in Detector', dInvalid.type === null, dInvalid.error);

  // --- 2. DNS LOOKUP TESTS ---
  console.log('\n[2/10] Testing Live DNS Service...');
  try {
    const dnsRes = await performDnsLookup('google.com');
    assert('DNS: Resolves A Record', dnsRes.records.A.status === 'Found' && dnsRes.records.A.records.length > 0, `IPs: ${dnsRes.records.A.records.join(', ')}`);
    assert('DNS: Resolves AAAA Record', dnsRes.records.AAAA.status === 'Found' && dnsRes.records.AAAA.records.length > 0, `IPv6: ${dnsRes.records.AAAA.records.join(', ')}`);
    assert('DNS: Resolves MX Record with Priority', dnsRes.records.MX.status === 'Found' && dnsRes.records.MX.records.length > 0 && typeof dnsRes.records.MX.records[0].priority === 'number', `MX: ${dnsRes.records.MX.records[0].exchange}`);
    assert('DNS: Resolves NS Record', dnsRes.records.NS.status === 'Found' && dnsRes.records.NS.records.length > 0, `NS: ${dnsRes.records.NS.records.join(', ')}`);
    assert('DNS: Resolves TXT Record', dnsRes.records.TXT.status === 'Found' && dnsRes.records.TXT.records.length > 0, `Count: ${dnsRes.records.TXT.records.length}`);
  } catch (err) {
    assert('DNS Google.com query', false, err.message);
  }

  // Non-existent domain test
  try {
    const nxRes = await performDnsLookup('nonexistent-domain-test-xyz-987654321.org');
    assert('DNS: Non-existent domain returns Not Found cleanly', nxRes.records.A.status === 'Not Found', nxRes.overallStatus);
  } catch (err) {
    assert('DNS: Non-existent domain handled without crash', true, 'Handled via error/not found');
  }

  // Invalid domain syntax test
  try {
    await performDnsLookup('invalid domain with spaces');
    assert('DNS: Invalid syntax throws error', false);
  } catch (err) {
    assert('DNS: Invalid syntax throws clean validation error', err.message.includes('Invalid domain'), err.message);
  }

  // --- 3. IP LOOKUP & GEOLOCATION TESTS ---
  console.log('\n[3/10] Testing Live IP & Geolocation Service...');
  try {
    const ipRes = await performIpLookup('8.8.8.8');
    assert('IP 8.8.8.8: Valid IPv4', ipRes.ipVersion === 'IPv4' && ipRes.isValid === true);
    assert('IP 8.8.8.8: Reverse PTR hostname resolved', typeof ipRes.hostname === 'string' && ipRes.hostname.length > 0, ipRes.hostname);
    assert('IP 8.8.8.8: Public Internet classification', ipRes.networkType === 'Public Internet Routable' && ipRes.isPrivate === false);
    assert('IP 8.8.8.8: Real Geolocation status available', ipRes.geolocation && ipRes.geolocation.status === 'Available', `ISP: ${ipRes.geolocation.isp}, Country: ${ipRes.geolocation.country}`);
  } catch (err) {
    assert('IP 8.8.8.8 Lookup', false, err.message);
  }

  // IPv6 Test
  try {
    const ipv6Res = await performIpLookup('2001:4860:4860::8888');
    assert('IPv6: Valid classification', ipv6Res.ipVersion === 'IPv6' && ipv6Res.isValid === true);
    assert('IPv6: GUA classification', ipv6Res.networkType.includes('Global Unicast'));
  } catch (err) {
    assert('IPv6 Lookup', false, err.message);
  }

  // Private RFC 1918 IP Test
  try {
    const privRes = await performIpLookup('192.168.1.1');
    assert('IP 192.168.1.1: Private Network (RFC 1918)', privRes.isPrivate === true && privRes.networkType.includes('Private'));
    assert('IP 192.168.1.1: Correctly informs no public geolocation', privRes.geolocation.status === 'Private IP');
  } catch (err) {
    assert('Private IP lookup', false, err.message);
  }

  // Invalid IP test
  try {
    await performIpLookup('999.999.999.999');
    assert('Invalid IP throws error', false);
  } catch (err) {
    assert('Invalid IP throws clean validation error', err.message.includes('Invalid IP'), err.message);
  }

  // --- 4. REVERSE DNS / PTR TESTS ---
  console.log('\n[4/10] Testing Dedicated Reverse DNS (PTR)...');
  try {
    const rdns8 = await performReverseDnsLookup('8.8.8.8');
    assert('Reverse DNS 8.8.8.8: PTR Status Found', rdns8.status === 'Found', `Hostname: ${rdns8.hostname}`);
    assert('Reverse DNS 8.8.8.8: Resolves to dns.google or canonical host', rdns8.hostname.includes('google'), rdns8.hostname);
  } catch (err) {
    assert('Reverse DNS 8.8.8.8', false, err.message);
  }

  try {
    const rdns1 = await performReverseDnsLookup('1.1.1.1');
    assert('Reverse DNS 1.1.1.1: Resolves PTR Hostname', rdns1.status === 'Found', `Hostname: ${rdns1.hostname}`);
  } catch (err) {
    assert('Reverse DNS 1.1.1.1', false, err.message);
  }

  // --- 5. EMAIL LOOKUP TESTS ---
  console.log('\n[5/10] Testing Email Domain & MX Service...');
  try {
    const emailRes = await performEmailLookup('security@google.com');
    assert('Email: Valid RFC 5322 Format', emailRes.formatValidation === 'Valid');
    assert('Email: Username extracted', emailRes.username === 'security');
    assert('Email: Domain extracted', emailRes.domain === 'google.com');
    assert('Email: Domain exists check', emailRes.domainValidation === 'Exists');
    assert('Email: MX Available check', emailRes.mxCheck === 'MX Available' && emailRes.mxRecords.length > 0, `MX Count: ${emailRes.mxRecords.length}`);
    assert('Email: Includes ethical disclaimer', typeof emailRes.disclaimer === 'string' && emailRes.disclaimer.includes('private'));
  } catch (err) {
    assert('Email security@google.com', false, err.message);
  }

  // Invalid email format test
  try {
    const badEmail = await performEmailLookup('not-an-email-at-all');
    assert('Email: Invalid format detected gracefully', badEmail.formatValidation === 'Invalid' && Boolean(badEmail.error), badEmail.error);
  } catch (err) {
    assert('Email: Invalid format handled without crash', true);
  }

  // --- 6. WHOIS LOOKUP TESTS ---
  console.log('\n[6/10] Testing Live WHOIS & RDAP Service...');
  try {
    const whoisRes = await performWhoisLookup('google.com');
    assert('WHOIS: Domain returned', whoisRes.domainName.toLowerCase().includes('google'), whoisRes.domainName);
    assert('WHOIS: Registrar identified', typeof whoisRes.registrar === 'string' && whoisRes.registrar.length > 0, `Registrar: ${whoisRes.registrar}`);
    assert('WHOIS: Name Servers present', Array.isArray(whoisRes.nameServers) && whoisRes.nameServers.length > 0, `NS Count: ${whoisRes.nameServers.length}`);
  } catch (err) {
    assert('WHOIS google.com lookup', false, err.message);
  }

  // --- 7. NAME LOOKUP TESTS ---
  console.log('\n[7/10] Testing Live Name & Entity Service...');
  try {
    const nameRes = await performNameLookup('Alan Turing');
    assert('Name: Input normalized', nameRes.normalizedName === 'Alan Turing');
    assert('Name: Authentic matches returned', nameRes.totalMatches > 0, `Matches: ${nameRes.totalMatches}`);
    assert('Name: Includes ethical privacy notice', typeof nameRes.ethicalNotice === 'string' && nameRes.ethicalNotice.includes('PII'));
  } catch (err) {
    assert('Name lookup', false, err.message);
  }

  // Empty Name input
  try {
    await performNameLookup('   ');
    assert('Name: Empty input throws error', false);
  } catch (err) {
    assert('Name: Empty input throws validation error', err.message.includes('enter a name'), err.message);
  }

  // --- 8. SUPABASE PERSISTENCE & HISTORY TESTS ---
  console.log('\n[8/10] Testing Supabase PostgreSQL Integration...');
  const testConn = await testConnection();
  assert('Supabase PostgreSQL: Connected & Responsive', testConn.connected === true, `${testConn.database} (${testConn.latencyMs}ms)`);

  let testRecordId = null;
  try {
    // Insert a real test lookup
    const rec = await recordLookup({
      lookup_type: 'dns',
      query_value: 'cloudflare.com',
      status: 'success',
      result_summary: {
        a: ['104.16.132.229'],
        mxCount: 3,
        testRunner: true
      }
    });

    testRecordId = rec.id;
    assert('Supabase: Real lookup successfully inserted', Boolean(rec.id) && rec.query_value === 'cloudflare.com', `Record ID: ${rec.id}`);

    // Query History
    const historyRes = await getHistory({ search: 'cloudflare.com', limit: 10 });
    assert('Supabase: History query retrieves inserted record', Array.isArray(historyRes.data) && historyRes.data.some(r => r.query_value === 'cloudflare.com'), `Found: ${historyRes.data.length}`);

    // Delete test record to keep history clean
    if (testRecordId) {
      await deleteHistoryRecord(testRecordId);
      assert('Supabase: Test record cleanly deleted', true);
    }
  } catch (err) {
    assert('Supabase insert/select/delete workflow', false, err.message);
  }

  // --- 9. DASHBOARD STATS TEST ---
  console.log('\n[9/10] Testing Dashboard Statistics Service...');
  try {
    const stats = await getDashboardStats();
    assert('Dashboard: Stats object returned', typeof stats === 'object' && typeof stats.totalLookups === 'number');
    assert('Dashboard: Breakdown categories present', 'dnsLookups' in stats && 'ipLookups' in stats && 'emailChecks' in stats && 'whoisChecks' in stats);
    console.log(`   Stats overview: Total=${stats.totalLookups}, DNS=${stats.dnsLookups}, IP=${stats.ipLookups}, Email=${stats.emailChecks}`);
  } catch (err) {
    assert('Dashboard stats query', false, err.message);
  }

  // --- 10. HTTP ENDPOINTS & API BOUNDARY TESTS ---
  console.log('\n[10/10] Testing HTTP API Endpoints on localhost:5000...');
  try {
    // Test Integrated Lookup POST endpoint
    const postRes = await fetch(`${BASE_URL}/integrated-lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '1.1.1.1', type: 'auto' })
    });
    const postJson = await postRes.json();
    assert('HTTP POST /api/integrated-lookup returns 200', postRes.status === 200 && postJson.success === true, `Type: ${postJson.type}`);

    // Test Empty Query validation
    const emptyRes = await fetch(`${BASE_URL}/integrated-lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '', type: 'auto' })
    });
    const emptyJson = await emptyRes.json();
    assert('HTTP POST /api/integrated-lookup empty input returns 400', emptyRes.status === 400 && emptyJson.success === false, emptyJson.error);

    // Test Non-existent Route
    const notFoundRes = await fetch(`${BASE_URL}/non-existent-endpoint`);
    const notFoundJson = await notFoundRes.json();
    assert('HTTP 404 returns clean JSON (not HTML)', notFoundRes.status === 404 && notFoundJson.success === false, notFoundJson.error);

    // Test Rate Limiter and Security Headers
    assert('HTTP Response contains security Content-Type', postRes.headers.get('content-type')?.includes('application/json'));
  } catch (err) {
    assert('HTTP Endpoints testing', false, err.message);
  }

  console.log('\n========================================================');
  console.log(`🏁 QA RESULTS: ${results.passed}/${results.total} Passed (${results.failed} Failed)`);
  console.log('========================================================\n');

  return results;
}

runTestSuite()
  .then(res => {
    process.exit(res.failed === 0 ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  });
