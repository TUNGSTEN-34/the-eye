// Vercel serverless endpoint: same-origin proxy for GDELT news discovery.
// This keeps browser CORS behavior out of the way and gives the frontend a small, stable response shape.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const queries = [
    'uganda',
    '"East Africa"'
  ];
  const errors = [];

  for (const query of queries) {
    const params = new URLSearchParams({
      query,
      mode: 'ArtList',
      format: 'json',
      sort: 'DateDesc',
      maxrecords: '25',
      timespan: '7d'
    });

    try {
      const upstream = await fetch('https://api.gdeltproject.org/api/v2/doc/doc?' + params.toString(), {
        headers: { Accept: 'application/json', 'User-Agent': 'TheEyeAnalyst/1.0 (public-interest news discovery)' }
      });
      if (!upstream.ok) {
        errors.push('GDELT returned HTTP ' + upstream.status);
        continue;
      }

      const payload = await upstream.json();
      const articles = Array.isArray(payload.articles)
        ? payload.articles
            .filter((item) => item && typeof item.title === 'string' && typeof item.url === 'string' && /^https?:\/\//i.test(item.url))
            .map((item) => ({
              title: item.title.slice(0, 500),
              url: item.url,
              domain: typeof item.domain === 'string' ? item.domain.slice(0, 160) : '',
              seendate: typeof item.seendate === 'string' ? item.seendate : ''
            }))
            .slice(0, 15)
        : [];

      if (articles.length) {
        return res.status(200).json({
          source: 'GDELT DOC 2.0',
          query,
          fetchedAt: new Date().toISOString(),
          articles
        });
      }
      errors.push('No usable articles for query: ' + query);
    } catch (error) {
      errors.push(error && error.message ? error.message : 'Unknown upstream error');
    }
  }

  return res.status(502).json({
    source: 'GDELT DOC 2.0',
    error: 'News source temporarily unavailable',
    details: errors.slice(0, 3),
    articles: []
  });
};
