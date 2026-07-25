import { useState, useRef } from 'react'

const ACCEPTED_TYPES = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/msword': 'Word',
  'image/jpeg': 'Imagen',
  'image/png': 'Imagen',
  'image/webp': 'Imagen',
  'image/gif': 'Imagen',
  'text/plain': 'Texto',
}

export default function Resumidor({ user }) {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const inputRef = useRef()

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  function handleFile(e) {
    const f = e.target.files[0]
    if (f) setFile(f)
  }

  async function extractTextFromPDF(file) {
    setProgress('Cargando PDF...')
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const s1 = document.createElement('script')
        s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
        s1.onload = resolve
        s1.onerror = reject
        document.head.appendChild(s1)
      })
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    }
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let text = ''
    setProgress('Extrayendo texto (0/' + pdf.numPages + ' paginas)...')
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map(item => item.str).join(' ') + '\n'
      setProgress('Extrayendo texto (' + i + '/' + pdf.numPages + ' paginas)...')
    }
    return text.trim()
  }

  async function extractTextFromWord(file) {
    setProgress('Cargando Word...')
    if (!window.mammoth) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
        s.onload = resolve
        s.onerror = reject
        document.head.appendChild(s)
      })
    }
    const arrayBuffer = await file.arrayBuffer()
    const result = await window.mammoth.extractRawText({ arrayBuffer })
    return result.value.trim()
  }

  async function handleSummarize() {
    if (!file) return
    setLoading(true)
    setSummary('')
    setError('')
    setProgress('')

    try {
      const type = file.type
      let payload = {}

      if (type.startsWith('image/')) {
        setProgress('Leyendo imagen...')
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        payload = { type: 'image', imageBase64: base64 }
      } else if (type === 'application/pdf') {
        const text = await extractTextFromPDF(file)
        if (!text) throw new Error('No se pudo extraer texto del PDF.')
        payload = { type: 'text', text: text.slice(0, 12000) }
      } else if (type.includes('word') || type.includes('openxmlformats')) {
        const text = await extractTextFromWord(file)
        if (!text) throw new Error('No se pudo extraer texto del Word.')
        payload = { type: 'text', text: text.slice(0, 12000) }
      } else if (type === 'text/plain') {
        const text = await file.text()
        payload = { type: 'text', text: text.slice(0, 12000) }
      } else {
        throw new Error('Formato no soportado')
      }

      setProgress('Generando resumen con IA...')
      const resp = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Error al resumir')
      setSummary(data.summary)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(summary)
  }

  function downloadTxt() {
    const blob = new Blob([summary], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resumen-' + (file ? file.name : 'documento') + '.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const fileType = file ? (ACCEPTED_TYPES[file.type] || 'Archivo') : null

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
        Resumidor IA
      </h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Subi un PDF, Word o imagen y la IA te genera un resumen automatico.
      </p>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current && inputRef.current.click()}
        style={{
          border: '2px dashed ' + (dragging ? '#6366f1' : '#cbd5e1'),
          borderRadius: 16,
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#f0f0ff' : '#f8fafc',
          transition: 'all 0.2s',
          marginBottom: '1.5rem'
        }}
      >
        <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleFile}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.gif" />
        {file ? (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>
              {fileType === 'Imagen' ? 'imagen' : fileType === 'PDF' ? 'PDF' : 'doc'}
            </div>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>{file.name}</div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>
              {fileType} - {(file.size / 1024).toFixed(1)} KB
            </div>
            <div style={{ color: '#6366f1', fontSize: '0.85rem', marginTop: 8 }}>
              Click para cambiar archivo
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📂</div>
            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
              Arrastra un archivo o hace click
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              PDF, Word (.docx), imagenes (JPG, PNG) o texto
            </div>
          </div>
        )}
      </div>
      <button
        onClick={handleSummarize}
        disabled={!file || loading}
        style={{
          width: '100%',
          padding: '0.9rem',
          background: (!file || loading) ? '#cbd5e1' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: '1rem',
          fontWeight: 600,
          cursor: (!file || loading) ? 'not-allowed' : 'pointer',
          marginBottom: '1.5rem',
          transition: 'all 0.2s'
        }}
      >
        {loading ? (progress || 'Procesando...') : 'Generar resumen con IA'}
      </button>
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
          padding: '1rem', color: '#dc2626', marginBottom: '1.5rem'
        }}>
          Error: {error}
        </div>
      )}
      {summary && (
        <div style={{
          background: 'white', border: '1px solid #e2e8f0', borderRadius: 16,
          padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Resumen generado
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copyToClipboard} style={{
                padding: '6px 14px', background: '#f1f5f9', border: 'none',
                borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
              }}>
                Copiar
              </button>
              <button onClick={downloadTxt} style={{
                padding: '6px 14px', background: '#ede9fe', color: '#6366f1', border: 'none',
                borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
              }}>
                Descargar
              </button>
            </div>
          </div>
          <div style={{
            whiteSpace: 'pre-wrap', color: '#334155', lineHeight: 1.7,
            fontSize: '0.95rem', maxHeight: 500, overflowY: 'auto'
          }}>
            {summary}
          </div>
        </div>
      )}
    </div>
  )
}
