/**
 * Real Live Name / Entity Intelligence Service
 * Queries authentic public open-source registries (GitHub Developer Search and Wikipedia Knowledge Base)
 * Adheres strictly to cybersecurity ethics and privacy standards (no private PII scraping).
 */

export async function performNameLookup(rawName) {
  const name = (rawName || '').trim();

  if (!name) {
    throw new Error('Please enter a name to search.');
  }

  // Sanitize: strip out suspicious control codes
  const sanitized = name.replace(/[^a-zA-Z0-9\s\-'.]/g, '').trim();

  if (!sanitized) {
    throw new Error('Please enter a valid alphabetic name.');
  }

  // Normalize: Title Case
  const normalized = sanitized
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

  // Fetch real public directory results in parallel
  const [githubResults, wikiResults] = await Promise.all([
    // 1. Query GitHub public accounts
    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      try {
        const res = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(normalized)}&per_page=5`, {
          headers: {
            'User-Agent': 'IntegratedLookupToolkit/1.0',
            'Accept': 'application/vnd.github.v3+json'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          return (data.items || []).map(item => ({
            username: item.login,
            profileUrl: item.html_url,
            avatarUrl: item.avatar_url,
            type: item.type
          }));
        }
      } catch {
        // Network timeout / non-blocking
      } finally {
        clearTimeout(timeoutId);
      }
      return [];
    })(),

    // 2. Query Wikipedia public entity search
    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      try {
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(normalized)}&utf8=&format=json&srlimit=3`, {
          headers: {
            'User-Agent': 'IntegratedLookupToolkit/1.0'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          const items = data.query?.search || [];
          return items.map(item => ({
            title: item.title,
            snippet: (item.snippet || '').replace(/<[^>]+>/g, ''),
            url: `https://en.wikipedia.org/?curid=${item.pageid}`
          }));
        }
      } catch {
        // Network timeout / non-blocking
      } finally {
        clearTimeout(timeoutId);
      }
      return [];
    })()
  ]);

  const totalMatches = githubResults.length + wikiResults.length;

  return {
    searchTerm: name,
    normalizedName: normalized,
    searchStatus: 'Completed',
    totalMatches,
    publicProfiles: githubResults,
    encyclopedicEntities: wikiResults,
    message: totalMatches > 0
      ? `Found ${totalMatches} authentic public entity and developer profile record(s).`
      : 'No public entity or developer profile matches found for this query in open registries.',
    ethicalNotice: 'Adheres to ethical OSINT guidelines: queries public registry and open knowledge indexes only. No private personal data (PII) is scraped or stored.'
  };
}
