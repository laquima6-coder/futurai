const ADMIN_EMAIL = 'laquima6@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Verify token and admin email
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
  const token = auth.slice(7);

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  // Verify user
  const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
  });
  if (!userResp.ok) return res.status(401).json({ error: 'Token invalido' });
  const userData = await userResp.json();
  if (userData.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Acceso denegado' });

  // Fetch all profiles using service key (server-side only)
  const action = req.query.action || 'stats';

  if (action === 'users') {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/futurai_perfiles?select=*&order=created_at.desc`, {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
    });
    return res.status(200).json(await r.json());
  }

  if (action === 'stats') {
    const tables = ['futurai_perfiles', 'futurai_notas', 'futurai_flashcard_sets', 'futurai_eventos', 'futurai_recordatorios'];
    const counts = {};
    for (const t of tables) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=id`, {
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Prefer': 'count=exact', 'Range': '0-0' }
      });
      counts[t] = parseInt(r.headers.get('content-range')?.split('/')[1] || '0');
    }
    return res.status(200).json(counts);
  }

  return res.status(400).json({ error: 'Accion no valida' });
}
