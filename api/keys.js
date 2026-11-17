import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { method, body, query } = req;
  const { pin } = body || {};

  // Verifikasi PIN dulu dari database
  const { data: settings } = await supabase
    .from('settings').select('value').eq('key', 'vault_pin').single();
  if (settings && settings.value !== pin) {
    return res.status(403).json({ error: "PIN Vault salah. Akses ditolak." });
  }

  if (method === 'GET') {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, nama_layanan, status, created_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);

  } else if (method === 'POST') {
    const { nama_layanan, api_key, status } = body;
    const { data, error } = await supabase
      .from('api_keys')
      .insert([{ nama_layanan, api_key, status: status || 'Valid' }])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, data });

  } else if (method === 'DELETE') {
    const { error } = await supabase
      .from('api_keys').delete().eq('id', query.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method tidak diizinkan' });
}
