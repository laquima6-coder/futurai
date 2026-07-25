export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify user is authenticated via Supabase JWT
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
  const token = auth.slice(7);

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
  });
  if (!userResp.ok) return res.status(401).json({ error: 'Token invalido' });

  const { text, imageBase64, type } = req.body;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'API key no configurada' });

  // Images require a vision API — Groq removed vision models, so we only support text/PDF/Word
  if (type === 'image') {
    return res.status(400).json({ error: 'El análisis de imágenes no está disponible actualmente. Subí un PDF o documento Word para resumir.' });
  }

  try {
    let messages;

    messages = [{
      role: 'user',
      content: `Sos un asistente academico. Resume el siguiente texto de forma clara y estructurada en español. Incluí: puntos clave, ideas principales y conceptos importantes.\n\n${text}`
    }];

    const model = 'llama-3.3-70b-versatile';

    const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({ model, messages, max_tokens: 1500, temperature: 0.3 })
    });

    const data = await groqResp.json();
    if (!groqResp.ok) return res.status(500).json({ error: data.error?.message || 'Error al resumir' });

    const summary = data.choices?.[0]?.message?.content;
    if (!summary) return res.status(500).json({ error: 'No se pudo generar el resumen' });

    return res.status(200).json({ summary });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
