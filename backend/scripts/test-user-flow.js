async function testUserFlow() {
  const targets = [
    { query: 'cloudflare.com', type: 'dns' },
    { query: '8.8.8.8', type: 'ip' },
    { query: '1.1.1.1', type: 'reverse-dns' },
    { query: 'security@cert.org', type: 'email' },
    { query: 'github.com', type: 'whois' },
    { query: 'Linus Torvalds', type: 'name' }
  ];

  console.log('--- Executing Live Lookups ---');
  for (const t of targets) {
    try {
      const res = await fetch('http://localhost:5000/api/integrated-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t)
      });
      const data = await res.json();
      console.log(`[${t.type}] Query: "${t.query}" -> Success: ${data.success}, Status Code: ${res.status}`);
    } catch (err) {
      console.error(`[${t.type}] Error:`, err.message);
    }
  }

  console.log('\n--- Verifying Supabase History ---');
  const histRes = await fetch('http://localhost:5000/api/history?limit=15');
  const histData = await histRes.json();
  console.log(`History count: ${histData.data.length}, Storage Source: ${histData.source}`);
  histData.data.slice(0, 6).forEach(h => {
    console.log(`  - [${h.lookup_type}] ${h.query_value} (${h.status})`);
  });

  console.log('\n--- Verifying Dashboard Stats ---');
  const statsRes = await fetch('http://localhost:5000/api/stats');
  const statsData = await statsRes.json();
  console.log('Aggregated Stats:', statsData.data);
}

testUserFlow().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
