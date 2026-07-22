import { useState } from 'react'

const IDIOMAS = [
  { code: 'es', nombre: 'Español' }, { code: 'en', nombre: 'Inglés' },
  { code: 'pt', nombre: 'Portugués' }, { code: 'fr', nombre: 'Francés' },
  { code: 'de', nombre: 'Alemán' }, { code: 'it', nombre: 'Italiano' },
  { code: 'zh', nombre: 'Chino' }, { code: 'ja', nombre: 'Japonés' },
  { code: 'ar', nombre: 'Árabe' }, { code: 'ru', nombre: 'Ruso' },
]

export default function Traductor() {
  const [texto, setTexto] = useState('')
  const [traduccion, setTraduccion] = useState('')
  const [desde, setDesde] = useState('es')
  const [hacia, setHacia] = useState('en')
  const [traduciendo, setTraduciendo] = useState(false)

  const traducir = async () => {
    if (!texto.trim()) return
    setTraduciendo(true)
    setTraduccion('')
    try {
      // Use MyMemory free API (500 words/day free)
      const q = encodeURIComponent(texto)
      const langPair = `${desde}|${hacia}`
      const resp = await fetch(`https://api.mymemory.translated.net/get?q=${q}&langpair=${langPair}&de=laquima6@gmail.com`)
      const data = await resp.json()
      if (data.responseStatus === 200) {
        setTraduccion(data.responseData.translatedText)
      } else {
        setTraduccion('Error al traducir. Intentá de nuevo.')
      }
    } catch {
      setTraduccion('Error de conexión.')
    } finally {
      setTraduciendo(false)
    }
  }

  const intercambiar = () => {
    const tmp = desde
    setDesde(hacia)
    setHacia(tmp)
    setTexto(traduccion)
    setTraduccion(texto)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🌐 Traductor</div>
        <div className="page-subtitle">Traducí textos a múltiples idiomas</div>
      </div>

      <div className="card">
        <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16 }}>
          <select value={desde} onChange={e => setDesde(e.target.value)} style={{ flex:1 }}>
            {IDIOMAS.map(i => <option key={i.code} value={i.code}>{i.nombre}</option>)}
          </select>
          <button className="btn btn-outline" onClick={intercambiar} title="Intercambiar idiomas">⇄</button>
          <select value={hacia} onChange={e => setHacia(e.target.value)} style={{ flex:1 }}>
            {IDIOMAS.map(i => <option key={i.code} value={i.code}>{i.nombre}</option>)}
          </select>
        </div>

        <div className="grid-2">
          <div>
            <label>Texto original</label>
            <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escribí o pegá el texto a traducir..."
              style={{ minHeight:200 }} />
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button className="btn btn-primary" onClick={traducir} disabled={!texto.trim() || traduciendo}>
                {traduciendo ? '⏳ Traduciendo...' : '🌐 Traducir'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => { setTexto(''); setTraduccion('') }}>Limpiar</button>
            </div>
          </div>

          <div>
            <label>Traducción</label>
            <textarea value={traduccion} readOnly placeholder="La traducción aparecerá aquí..."
              style={{ minHeight:200, background:'#f8faff' }} />
            {traduccion && (
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(traduccion)}>📋 Copiar</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginTop:12 }}>
        💡 Usa MyMemory API gratuita (hasta 500 palabras por día). Para uso intensivo podés conectar Google Translate o DeepL.
      </div>
    </div>
  )
}
