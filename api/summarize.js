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
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'API key no configurada' });

  try {
    let parts;

    if (type === 'image' && imageBase64) {
      // Extract mime type and base64 data from data URL
      const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      const mimeType = matches ? matches[1] : 'image/jpeg';
      const b64data = matches ? matches[2] : imageBase64;

      parts = [
        { text: 'Analiza esta imagen y hace un resumen detallado en español. Si hay texto, transcribilo. Si hay un diagrama o tabla, explicalo.' },
        { inline_data: { mime_type: mimeType, data: b64data } }
      ];
    } else {
      parts = [{ text: `Sos un asistente academico. Resume el siguiente texto de forma clara y estructurada en español. Incluí: puntos clave, ideas principales y conceptos importantes.\n\n${text}` }];
    }

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      }
    );

    const data = await geminiResp.json();
    if (!geminiResp.ok) return res.status(500).json({ error: data.error?.message || 'Error al resumir' });

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!summary) return res.status(500).json({ error: 'No se pudo generar el resumen' });

    return res.status(200).json({ summary });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
