export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Prefer, apikey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pathSegments = req.query.path || [];
  const path = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

  const url = new URL(req.url, `https://${req.headers.host}`);
  const queryString = url.search;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({
      error: 'Server misconfigured',
      message: 'SUPABASE_URL atau SUPABASE_KEY belum di-set di Environment Variables'
    });
  }

  const targetUrl = `\( {SUPABASE_URL}/ \){path}${queryString}`;

  try {
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    };

    if (req.headers.prefer) {
      headers['Prefer'] = req.headers.prefer;
    }

    let body = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseText = await response.text();
    res.status(response.status);

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    return res.send(responseText);

  } catch (error) {
    console.error('[Proxy Error]', error.message);
    return res.status(500).json({
      error: 'Proxy request failed',
      message: error.message
    });
  }
}
