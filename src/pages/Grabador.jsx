import { useState, useRef } from 'react'

export default function Grabador() {
  const [grabando, setGrabando] = useState(false)
  const [transcripcion, setTranscripcion] = useState('')
  const [grabaciones, setGrabaciones] = useState([])
  const [audioURL, setAudioURL] = useState(null)
  const [tiempo, setTiempo] = useState(0)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const reconocimientoRef = useRef(null)

  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioURL(url)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      setGrabando(true)
      setTiempo(0)
      timerRef.current = setInterval(() => setTiempo(t => t + 1), 1000)

      // Speech recognition
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SR) {
        const rec = new SR()
        reconocimientoRef.current = rec
        rec.lang = 'es-AR'
        rec.continuous = true
        rec.interimResults = true
        rec.onresult = (e) => {
          let texto = ''
          for (let i = 0; i < e.results.length; i++) texto += e.results[i][0].transcript + ' '
          setTranscripcion(texto)
        }
        rec.start()
      }
    } catch (err) {
      alert('No se pudo acceder al micrófono: ' + err.message)
    }
  }

  const detenerGrabacion = () => {
    if (mediaRef.current) mediaRef.current.stop()
    if (reconocimientoRef.current) reconocimientoRef.current.stop()
    clearInterval(timerRef.current)
    setGrabando(false)
  }

  const guardarGrabacion = () => {
    if (!audioURL) return
    const nueva = {
      id: Date.now(),
      titulo: `Clase ${new Date().toLocaleDateString('es-AR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}`,
      url: audioURL,
      transcripcion,
      duracion: tiempo,
      fecha: new Date().toISOString()
    }
    setGrabaciones(p => [nueva, ...p])
    setAudioURL(null)
    setTranscripcion('')
    setTiempo(0)
  }

  const formatTiempo = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🎙️ Grabador de clases</div>
        <div className="page-subtitle">Grabá tus clases con transcripción automática</div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">🎙️ Grabación</div>
          <div style={{ textAlign:'center', padding:'24px 0' }}>
            <div style={{ fontSize:64, marginBottom:16, animation: grabando ? 'pulse 1s infinite' : 'none' }}>🎙️</div>
            <div style={{ fontSize:36, fontWeight:900, color: grabando ? '#ef4444' : '#94a3b8', fontFamily:'monospace', marginBottom:20 }}>
              {formatTiempo(tiempo)}
            </div>
            {!grabando ? (
              <button className="btn btn-primary" style={{ padding:'14px 32px', fontSize:16 }} onClick={iniciarGrabacion}>
                ⏺ Iniciar grabación
              </button>
            ) : (
              <button className="btn btn-danger" style={{ padding:'14px 32px', fontSize:16 }} onClick={detenerGrabacion}>
                ⏹ Detener
              </button>
            )}
          </div>

          {audioURL && (
            <div style={{ marginTop:16, padding:16, background:'#f8faff', borderRadius:10 }}>
              <div style={{ fontWeight:700, marginBottom:8 }}>✅ Grabación lista</div>
              <audio controls src={audioURL} style={{ width:'100%', marginBottom:12 }} />
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-primary" onClick={guardarGrabacion}>💾 Guardar</button>
                <a href={audioURL} download={`clase-${Date.now()}.webm`} className="btn btn-outline">⬇️ Descargar</a>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">📝 Transcripción en tiempo real</div>
          <div style={{ minHeight:200, padding:16, background:'#f8faff', borderRadius:10, fontSize:14, lineHeight:1.7 }}>
            {transcripcion || <span style={{ color:'#94a3b8' }}>La transcripción aparecerá aquí mientras grabás...</span>}
          </div>
          {transcripcion && (
            <div style={{ marginTop:10, display:'flex', gap:8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(transcripcion)}>📋 Copiar</button>
              <button className="btn btn-outline btn-sm" onClick={() => setTranscripcion('')}>🗑️ Limpiar</button>
            </div>
          )}
          <div className="alert alert-info" style={{ marginTop:12 }}>
            💡 La transcripción funciona con el micrófono del navegador. Para mejor resultado usá Chrome.
          </div>
        </div>
      </div>

      {grabaciones.length > 0 && (
        <div className="card" style={{ marginTop:20 }}>
          <div className="card-title">📚 Grabaciones guardadas</div>
          {grabaciones.map(g => (
            <div key={g.id} style={{ padding:'14px 0', borderBottom:'1px solid #f1f5f9' }}>
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight:700 }}>{g.titulo}</div>
                  <div style={{ fontSize:12, color:'#94a3b8' }}>{formatTiempo(g.duracion)} · {new Date(g.fecha).toLocaleDateString('es-AR')}</div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <a href={g.url} download className="btn btn-outline btn-sm">⬇️</a>
                </div>
              </div>
              <audio controls src={g.url} style={{ width:'100%', marginTop:8, height:32 }} />
              {g.transcripcion && (
                <details style={{ marginTop:8 }}>
                  <summary style={{ cursor:'pointer', fontSize:13, color:'#6366f1', fontWeight:600 }}>Ver transcripción</summary>
                  <div style={{ marginTop:8, padding:10, background:'#f8faff', borderRadius:8, fontSize:13, lineHeight:1.6 }}>{g.transcripcion}</div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }`}</style>
    </div>
  )
}
