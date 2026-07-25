// Vercel serverless function — AI summarization using OpenAI
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, imageBase64, type } = req.body;
  const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    let messages;

    if (type === 'image' && imageBase64) {
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: 'Analizá esta imagen y hacé un resumen detallado en español. Si hay texto, transcribilo. Si hay un diagrama o tabla, explicalo.' },
          { type: 'image_url', image_url: { url: imageBase64 } }
        ]
      }];
    } else {
      const prompt = `Sos un asistente académico. Resumí el siguiente texto de forma clara y estructurada en español. 
Incluí: puntos clave, ideas principales, y conceptos importantes.
Texto a resumir:\n\n${text}`;
      messages = [{ role: 'user', content: prompt }];
    }

    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: type === 'image' ? 'gpt-4o' : 'gpt-4o-mini',
        messages,
        max_tokens: 1500,
        temperature: 0.3
      })
    });

    const data = await openaiResp.json();
    if (!openaiResp.ok) return res.status(500).json({ error: data.error?.message || 'OpenAI error' });

    return res.status(200).json({ summary: data.choices[0].message.content });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
