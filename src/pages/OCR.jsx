import { useState, useRef } from 'react'

export default function OCR() {
  const [imagen, setImagen] = useState(null)
  const [texto, setTexto] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const fileRef = useRef()

  const procesarImagen = async (file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setImagen(url)
    setTexto('')
    setProcesando(true)
    setProgreso(0)

    try {
      // Load Tesseract.js from CDN dynamically
      if (!window.Tesseract) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      const worker = await Tesseract.createWorker(['spa', 'eng'], 1, {
        logger: m => { if (m.status === 'recognizing text') setProgreso(Math.round(m.progress * 100)) }
      })
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()
      setTexto(text.trim())
    } catch (err) {
      setTexto('Error al procesar la imagen: ' + err.message)
    } finally {
      setProcesando(false)
    }
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (file) procesarImagen(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) procesarImagen(file)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📷 OCR — Foto a texto</div>
        <div className="page-subtitle">Convertí fotos de apuntes y libros en texto editable</div>
      </div>

      <div className="grid-2">
        <div>
          <div className="card" style={{ marginBottom:16 }}
            onDragOver={e => e.preventDefault()} onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            style={{ cursor:'pointer', border:'2px dashed #e2e8f0', textAlign:'center', padding:32, transition:'.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#6366f1'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>
            <div style={{ fontSize:48, marginBottom:12 }}>📷</div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>Arrastrá una imagen o hacé click</div>
            <div className="text-muted">JPG, PNG, PDF, TIFF soportados</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
          </div>

          {imagen && (
            <div className="card">
              <div className="card-title">Vista previa</div>
              <img src={imagen} alt="preview" style={{ width:'100%', borderRadius:8, maxHeight:300, objectFit:'contain' }} />
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">📝 Texto extraído</div>
          {procesando ? (
            <div style={{ textAlign:'center', padding:40 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
              <div style={{ fontWeight:700, marginBottom:12 }}>Procesando imagen...</div>
              <div className="progress">
                <div className="progress-bar" style={{ width:`${progreso}%` }} />
              </div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:8 }}>{progreso}%</div>
            </div>
          ) : texto ? (
            <>
              <textarea value={texto} onChange={e => setTexto(e.target.value)}
                style={{ width:'100%', minHeight:300, border:'1px solid #e2e8f0', borderRadius:8, padding:12, fontSize:14, lineHeight:1.7, resize:'vertical', fontFamily:'inherit' }} />
              <div style={{ display:'flex', gap:8, marginTop:10 }}>
                <button className="btn btn-primary btn-sm" onClick={() => navigator.clipboard.writeText(texto)}>📋 Copiar todo</button>
                <button className="btn btn-outline btn-sm" onClick={() => {
                  const a = document.createElement('a'); a.href = 'data:text/plain,' + encodeURIComponent(texto); a.download = 'texto-ocr.txt'; a.click()
                }}>⬇️ Descargar .txt</button>
                <button className="btn btn-outline btn-sm" onClick={() => setTexto('')}>🗑️ Limpiar</button>
              </div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:8 }}>{texto.split(/\s+/).filter(Boolean).length} palabras · {texto.length} caracteres</div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <p>El texto aparecerá aquí después de procesar la imagen</p>
            </div>
          )}
        </div>
      </div>

      <div className="alert alert-info" style={{ marginTop:16 }}>
        💡 El OCR funciona completamente en tu navegador sin enviar datos a servidores. Para mejores resultados usá imágenes con buena iluminación y texto claro.
      </div>
    </div>
  )
}
