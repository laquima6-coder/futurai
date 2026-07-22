import { useState, useRef, useEffect } from 'react'

let nodeId = 0
const newId = () => ++nodeId

export default function MapaConceptual() {
  const [nodos, setNodos] = useState([
    { id: 1, texto: 'Tema principal', x: 300, y: 200, tipo: 'central' }
  ])
  const [conexiones, setConexiones] = useState([])
  const [seleccionado, setSeleccionado] = useState(null)
  const [conectando, setConectando] = useState(null)
  const [drag, setDrag] = useState(null)
  const [editando, setEditando] = useState(null)
  const svgRef = useRef()
  nodeId = Math.max(nodeId, ...nodos.map(n => n.id))

  const agregarNodo = () => {
    const nuevo = { id: newId(), texto: 'Nuevo concepto', x: 150 + Math.random()*400, y: 100 + Math.random()*300, tipo: 'normal' }
    setNodos(p => [...p, nuevo])
    if (seleccionado) setConexiones(p => [...p, { id: newId(), desde: seleccionado, hasta: nuevo.id }])
  }

  const eliminarNodo = (id) => {
    setNodos(p => p.filter(n => n.id !== id))
    setConexiones(p => p.filter(c => c.desde !== id && c.hasta !== id))
    if (seleccionado === id) setSeleccionado(null)
  }

  const handleMouseDown = (e, id) => {
    e.stopPropagation()
    setSeleccionado(id)
    const startX = e.clientX
    const startY = e.clientY
    const nodo = nodos.find(n => n.id === id)
    setDrag({ id, startX, startY, origX: nodo.x, origY: nodo.y })
  }

  const handleMouseMove = (e) => {
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    setNodos(p => p.map(n => n.id === drag.id ? { ...n, x: drag.origX + dx, y: drag.origY + dy } : n))
  }

  const handleMouseUp = () => setDrag(null)

  const exportar = () => {
    const svg = svgRef.current
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const a = document.createElement('a')
    a.href = 'data:image/svg+xml,' + encodeURIComponent(svgStr)
    a.download = 'mapa-conceptual.svg'
    a.click()
  }

  const limpiar = () => {
    if (confirm('¿Limpiar todo el mapa?')) {
      setNodos([{ id: 1, texto: 'Tema principal', x: 300, y: 200, tipo: 'central' }])
      setConexiones([])
      setSeleccionado(null)
      nodeId = 1
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🧠 Mapas conceptuales</div>
        <div className="page-subtitle">Organizá tus ideas visualmente</div>
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="btn btn-primary" onClick={agregarNodo}>+ Agregar nodo</button>
          {seleccionado && (
            <>
              <button className="btn btn-danger btn-sm" onClick={() => eliminarNodo(seleccionado)}>🗑️ Eliminar nodo</button>
              <button className="btn btn-outline btn-sm" onClick={() => setSeleccionado(null)}>Deseleccionar</button>
            </>
          )}
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button className="btn btn-outline" onClick={exportar}>⬇️ Exportar SVG</button>
            <button className="btn btn-outline" onClick={limpiar}>🗑️ Limpiar</button>
          </div>
        </div>
        {seleccionado && (
          <div style={{ marginTop:10, display:'flex', gap:8, alignItems:'center' }}>
            <label style={{ fontSize:12, color:'#94a3b8', margin:0 }}>Editar texto:</label>
            <input value={nodos.find(n => n.id === seleccionado)?.texto || ''} onChange={e => setNodos(p => p.map(n => n.id === seleccionado ? { ...n, texto: e.target.value } : n))}
              style={{ flex:1, maxWidth:300 }} />
          </div>
        )}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <svg ref={svgRef} style={{ width:'100%', height:500, cursor: drag ? 'grabbing' : 'default', display:'block' }}
          onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
          onClick={() => setSeleccionado(null)}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
            </marker>
          </defs>
          {/* Conexiones */}
          {conexiones.map(c => {
            const desde = nodos.find(n => n.id === c.desde)
            const hasta = nodos.find(n => n.id === c.hasta)
            if (!desde || !hasta) return null
            return <line key={c.id} x1={desde.x} y1={desde.y} x2={hasta.x} y2={hasta.y}
              stroke="#6366f1" strokeWidth="2" strokeOpacity=".5" markerEnd="url(#arrow)" />
          })}
          {/* Nodos */}
          {nodos.map(n => {
            const w = Math.max(100, n.texto.length * 9)
            const h = n.tipo === 'central' ? 50 : 40
            return (
              <g key={n.id} transform={`translate(${n.x - w/2}, ${n.y - h/2})`}
                onMouseDown={e => handleMouseDown(e, n.id)}
                style={{ cursor:'grab', userSelect:'none' }}>
                <rect width={w} height={h} rx={n.tipo === 'central' ? 25 : 20}
                  fill={n.tipo === 'central' ? 'url(#grad)' : (seleccionado === n.id ? '#eef2ff' : '#fff')}
                  stroke={seleccionado === n.id ? '#6366f1' : '#c7d2fe'}
                  strokeWidth={seleccionado === n.id ? 2.5 : 1.5}
                  filter="drop-shadow(0 2px 4px rgba(99,102,241,.2))" />
                <text x={w/2} y={h/2} textAnchor="middle" dominantBaseline="middle"
                  fontSize={n.tipo === 'central' ? 14 : 12} fontWeight={n.tipo === 'central' ? '800' : '600'}
                  fill={n.tipo === 'central' ? '#fff' : '#1e293b'}>
                  {n.texto}
                </text>
                <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="alert alert-info" style={{ marginTop:12 }}>
        💡 Hacé click en un nodo para seleccionarlo. Al agregar un nodo nuevo se conecta automáticamente al seleccionado. Arrastrá los nodos para reordenarlos.
      </div>
    </div>
  )
}
