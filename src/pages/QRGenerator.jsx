import { useState, useEffect, useRef } from 'react'

export default function QRGenerator() {
  const [texto, setTexto] = useState('https://futurai.app')
  const [tipo, setTipo] = useState('url')
  const [color, setColor] = useState('#6366f1')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [tamano, setTamano] = useState(300)
  const canvasRef = useRef()
  const [qrLoaded, setQrLoaded] = useState(false)

  useEffect(() => {
    // Load QRCode.js
    if (!window.QRCode) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
      script.onload = () => setQrLoaded(true)
      document.head.appendChild(script)
    } else { setQrLoaded(true) }
  }, [])

  useEffect(() => {
    if (!qrLoaded || !texto) return
    const container = document.getElementById('qr-container')
    if (!container) return
    container.innerHTML = ''
    try {
      new QRCode(container, {
        text: texto,
        width: tamano,
        height: tamano,
        colorDark: color,
        colorLight: bgColor,
        correctLevel: QRCode.CorrectLevel.H
      })
    } catch(e) {}
  }, [texto, color, bgColor, tamano, qrLoaded])

  const plantillas = {
    url: 'https://mi-sitio.com',
    wifi: 'WIFI:T:WPA;S:MiRed;P:MiContraseña;;',
    email: 'mailto:profesor@universidad.edu',
    tel: 'tel:+54911234567',
    texto: 'Mi texto personalizado',
  }

  const descargar = () => {
    const canvas = document.querySelector('#qr-container canvas')
    if (canvas) {
      const a = document.createElement('a')
      a.href = canvas.toDataURL()
      a.download = 'qr-futurai.png'
      a.click()
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🔲 Generador de QR</div>
        <div className="page-subtitle">Creá códigos QR personalizados</div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">⚙️ Configuración</div>
          <div className="form-group">
            <label>Tipo de QR</label>
            <select value={tipo} onChange={e => { setTipo(e.target.value); setTexto(plantillas[e.target.value]) }}>
              <option value="url">🌐 URL / Link</option>
              <option value="wifi">📶 WiFi</option>
              <option value="email">📧 Email</option>
              <option value="tel">📱 Teléfono</option>
              <option value="texto">📝 Texto libre</option>
            </select>
          </div>
          <div className="form-group">
            <label>Contenido</label>
            <textarea value={texto} onChange={e => setTexto(e.target.value)} style={{ minHeight:80 }} placeholder="Pegá tu URL o texto..." />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Color del QR</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ height:42, cursor:'pointer' }} />
            </div>
            <div className="form-group">
              <label>Fondo</label>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ height:42, cursor:'pointer' }} />
            </div>
          </div>
          <div className="form-group">
            <label>Tamaño: {tamano}px</label>
            <input type="range" min="150" max="500" step="50" value={tamano} onChange={e => setTamano(Number(e.target.value))} style={{ border:'none', background:'transparent', padding:0 }} />
          </div>
        </div>

        <div className="card" style={{ textAlign:'center' }}>
          <div className="card-title" style={{ justifyContent:'center' }}>Vista previa</div>
          <div id="qr-container" style={{ display:'flex', justifyContent:'center', marginBottom:16 }} />
          {!qrLoaded && <div className="spinner" />}
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            <button className="btn btn-primary" onClick={descargar}>⬇️ Descargar PNG</button>
          </div>
          <div className="alert alert-info" style={{ marginTop:16, textAlign:'left' }}>
            💡 El QR se genera en tu dispositivo, sin enviar datos a ningún servidor.
          </div>
        </div>
      </div>
    </div>
  )
}
