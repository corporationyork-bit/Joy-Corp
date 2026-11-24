export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = process.env.GUMROAD_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ ok: false, error: "GUMROAD_ACCESS_TOKEN belum diatur di Vercel" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const title = String(body.title || body.name || "").trim();
    const description = String(body.description || "");
    const priceCents = Number(
      body.price_cents || Math.round(Number(body.price_usd || 29) * 100)
    );

    if (!title) {
      return res.status(400).json({ ok: false, error: "Judul produk (title) wajib ada" });
    }

    // 1. Ambil daftar produk yang sudah ada di akun Gumroad
    const listUrl = `https://api.gumroad.com/v2/products?access_token=${encodeURIComponent(token)}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    if (!listRes.ok || !listData.success) {
      return res.status(listRes.status || 401).json({
        ok: false,
        error: listData.message || "Token Gumroad tidak valid atau gagal membaca produk"
      });
    }

    // 2. Cocokkan produk berdasarkan judul (exact match dulu, lalu fallback awalan sebelum [...] jika ada)
    const products = Array.isArray(listData.products) ? listData.products : [];
    const baseTitle = title.replace(/\s*\[[^\]]*\]\s*$/g, "").trim().toLowerCase();

    const existing =
      products.find((p) => String(p.name || "").trim().toLowerCase() === title.toLowerCase()) ||
      products.find((p) => String(p.name || "").trim().toLowerCase() === baseTitle);

    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: `Produk "${title}" belum ada di Gumroad. Buat produk dengan judul yang sama di dashboard Gumroad terlebih dahulu (API Gumroad tidak mendukung pembuatan produk baru).`
      });
    }

    // 3. Perbarui detail dan aktifkan produk di Gumroad
    const params = new URLSearchParams({
      access_token: token,
      name: existing.name || title,
      description,
      price: String(Number.isFinite(priceCents) && priceCents > 0 ? priceCents : 2900),
      published: "true"
    });

    const updRes = await fetch(`https://api.gumroad.com/v2/products/${existing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });

    const updData = await updRes.json();
    if (!updRes.ok || !updData.success) {
      return res.status(updRes.status || 400).json({
        ok: false,
        error: updData.message || "Gagal memperbarui produk di Gumroad"
      });
    }

    return res.status(200).json({
      ok: true,
      product_id: existing.id,
      product: updData.product
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
}
