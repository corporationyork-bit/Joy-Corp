export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.GUMROAD_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ ok: false, error: 'GUMROAD_ACCESS_TOKEN belum diatur di Vercel' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const priceUsd = Number(body.price_usd || 29);

    if (!title) {
      return res.status(400).json({ ok: false, error: 'Judul produk wajib diisi' });
    }

    // Gumroad API v2 expects price in cents
    const priceCents = Math.max(100, Math.round(priceUsd * 100));

    const params = new URLSearchParams();
    params.append('access_token', token);
    params.append('name', title);
    params.append('description', description || title);
    params.append('price', String(priceCents));

    const gumroadRes = await fetch('https://api.gumroad.com/v2/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await gumroadRes.json().catch(() => ({}));

    if (!gumroadRes.ok || data.success === false) {
      return res.status(gumroadRes.status || 400).json({
        ok: false,
        error: data.message || 'Gumroad API menolak permintaan',
        detail: data
      });
    }

    return res.status(200).json({
      ok: true,
      store: 'https://corporationyork.gumroad.com/',
      product: data.product || null
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Server error' });
  }
}
