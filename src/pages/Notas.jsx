import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Notas({ user }) {
  const [notas, setNotas] = useState([])
  const [carpetas, setCarpetas] = useState([])
  const [carpetaActiva, setCarpetaActiva] = useState(null)
  const [notaActiva, setNotaActiva] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [showNuevaCarpeta, setShowNuevaCarpeta] = useState(false)
  const [nuevaCarpeta, setNuevaCarpeta] = useState({ nombre: '', color: '#6366f1', icono: '📁' })
  const uid = user.id

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const [{ data: c }, { data: n }] = await Promise.all([
      supabase.from('futurai_carpetas').select('*').eq('user_id', uid).order('created_at'),
      supabase.from('futurai_notas').select('*').eq('user_id', uid).order('updated_at', { ascending: false }),
    ])
    setCarpetas(c || [])
    setNotas(n || [])
    if (n && n.length > 0 && !notaActiva) setNotaActiva(n[0])
  }

  const nuevaNota = async () => {
    const { data } = await supabase.from('futurai_notas').insert({
      user_id: uid,
      titulo: 'Nueva nota',
      contenido: '',
      carpeta_id: carpetaActiva,
    }).select().single()
    if (data) { setNotas(p => [data, ...p]); setNotaActiva(data) }
  }

  const guardarNota = async (campo, valor) => {
    if (!notaActiva) return
    const updated = { ...notaActiva, [campo]: valor, updated_at: new Date().toISOString() }
    setNotaActiva(updated)
    setNotas(p => p.map(n => n.id === updated.id ? updated : n))
    await supabase.from('futurai_notas').update({ [campo]: valor, updated_at: updated.updated_at }).eq('id', notaActiva.id)
  }

  const eliminarNota = async (id) => {
    await supabase.from('futurai_notas').delete().eq('id', id)
    const nuevas = notas.filter(n => n.id !== id)
    setNotas(nuevas)
    setNotaActiva(nuevas[0] || null)
  }

  const crearCarpeta = async () => {
    const { data } = await supabase.from('futurai_carpetas').insert({ user_id: uid, ...nuevaCarpeta }).select().single()
    if (data) { setCarpetas(p => [...p, data]); setShowNuevaCarpeta(false); setNuevaCarpeta({ nombre: '', color: '#6366f1', icono: '📁' }) }
  }

  const notasFiltradas = notas.filter(n =>
    (carpetaActiva ? n.carpeta_id === carpetaActiva : true) &&
    (busqueda ? n.titulo.toLowerCase().includes(busqueda.toLowerCase()) || n.contenido.toLowerCase().includes(busqueda.toLowerCase()) : true)
  )

  const iconos = ['📁','📚','🎓','💡','🔬','⚗️','📖','✏️','🧪','🎨','💻','🌍']
  const colores = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#22c55e','#06b6d4','#3b82f6']

  return (
    <div style={{ display:'flex', gap:0, height:'calc(100vh - 80px)', background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 24px rgba(99,102,241,.1)', border:'1px solid #e2e8f0' }}>
      {/* Sidebar notas */}
      <div style={{ width:280, borderRight:'1px solid #e2e8f0', display:'flex', flexDirection:'column', background:'#f8faff' }}>
        <div style={{ padding:16, borderBottom:'1px solid #e2e8f0' }}>
          <div className="flex-between mb-16">
            <span style={{ fontWeight:800, fontSize:16 }}>📝 Notas</span>
            <button className="btn btn-primary btn-sm" onClick={nuevaNota}>+ Nueva</button>
          </div>
          <input placeholder="🔍 Buscar notas..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ fontSize:13 }} />
        </div>

        {/* Carpetas */}
        <div style={{ padding:'8px 12px', borderBottom:'1px solid #e2e8f0' }}>
          <div className="flex-between" style={{ marginBottom:6 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>Carpetas</span>
            <button className="btn-icon" style={{ width:24, height:24, fontSize:14 }} onClick={() => setShowNuevaCarpeta(true)}>+</button>
          </div>
          <div className="list-item" style={{ border:'none', padding:'6px 8px', borderRadius:8, background: !carpetaActiva ? '#eef2ff' : 'transparent', color: !carpetaActiva ? '#6366f1' : 'inherit' }}
            onClick={() => setCarpetaActiva(null)}>
            <span>📋</span><span style={{ fontSize:13 }}>Todas las notas</span>
            <span style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8' }}>{notas.length}</span>
          </div>
          {carpetas.map(c => (
            <div key={c.id} className="list-item" style={{ border:'none', padding:'6px 8px', borderRadius:8, background: carpetaActiva === c.id ? '#eef2ff' : 'transparent', color: carpetaActiva === c.id ? '#6366f1' : 'inherit' }}
              onClick={() => setCarpetaActiva(c.id)}>
              <span style={{ color: c.color }}>{c.icono}</span>
              <span style={{ fontSize:13 }}>{c.nombre}</span>
              <span style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8' }}>{notas.filter(n => n.carpeta_id === c.id).length}</span>
            </div>
          ))}
        </div>

        {/* Lista de notas */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {notasFiltradas.length === 0 ? (
            <div className="empty-state" style={{ padding:24 }}>
              <div className="empty-icon">📝</div>
              <p style={{ fontSize:13 }}>No hay notas</p>
              <button className="btn btn-primary btn-sm" onClick={nuevaNota} style={{ marginTop:8 }}>Crear nota</button>
            </div>
          ) : notasFiltradas.map(nota => (
            <div key={nota.id} onClick={() => setNotaActiva(nota)}
              style={{ padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #f1f5f9',
                background: notaActiva?.id === nota.id ? '#eef2ff' : 'transparent',
                borderLeft: notaActiva?.id === nota.id ? '3px solid #6366f1' : '3px solid transparent' }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:3 }}>{nota.titulo || 'Sin título'}</div>
              <div style={{ fontSize:12, color:'#94a3b8', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                {nota.contenido?.replace(/[#*`]/g,'') || 'Nota vacía'}
              </div>
              <div style={{ fontSize:11, color:'#cbd5e1', marginTop:4 }}>
                {new Date(nota.updated_at).toLocaleDateString('es-AR')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        {notaActiva ? (
          <>
            <div style={{ padding:'12px 20px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:12 }}>
              <input value={notaActiva.titulo} onChange={e => guardarNota('titulo', e.target.value)}
                style={{ flex:1, border:'none', fontSize:20, fontWeight:800, background:'transparent', color:'#1e293b', padding:0 }}
                placeholder="Título de la nota" />
              <button className="btn btn-danger btn-sm" onClick={() => { if(confirm('¿Eliminar nota?')) eliminarNota(notaActiva.id) }}>🗑️</button>
            </div>
            <textarea
              className="note-editor"
              style={{ flex:1, padding:'20px', border:'none', resize:'none', fontSize:15, lineHeight:1.7 }}
              placeholder="Escribí tu nota aquí... Podés usar Markdown: # Título, **negrita**, *cursiva*, - lista"
              value={notaActiva.contenido}
              onChange={e => guardarNota('contenido', e.target.value)}
            />
            <div style={{ padding:'8px 20px', borderTop:'1px solid #e2e8f0', fontSize:11, color:'#94a3b8', display:'flex', justifyContent:'space-between' }}>
              <span>{notaActiva.contenido?.split(/\s+/).filter(Boolean).length || 0} palabras</span>
              <span>Guardado automáticamente ✓</span>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div className="empty-icon">📝</div>
            <p>Seleccioná una nota o creá una nueva</p>
            <button className="btn btn-primary" onClick={nuevaNota} style={{ marginTop:16 }}>+ Nueva nota</button>
          </div>
        )}
      </div>

      {/* Modal nueva carpeta */}
      {showNuevaCarpeta && (
        <div className="modal-overlay" onClick={() => setShowNuevaCarpeta(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Nueva carpeta</div>
              <button className="modal-close" onClick={() => setShowNuevaCarpeta(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>Nombre</label>
              <input value={nuevaCarpeta.nombre} onChange={e => setNuevaCarpeta(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre de la carpeta" />
            </div>
            <div className="form-group">
              <label>Ícono</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {iconos.map(i => (
                  <button key={i} onClick={() => setNuevaCarpeta(p => ({ ...p, icono: i }))}
                    style={{ width:36, height:36, border: nuevaCarpeta.icono === i ? '2px solid #6366f1' : '2px solid #e2e8f0', borderRadius:8, background:'#f8faff', cursor:'pointer', fontSize:18 }}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Color</label>
              <div style={{ display:'flex', gap:8 }}>
                {colores.map(c => (
                  <button key={c} onClick={() => setNuevaCarpeta(p => ({ ...p, color: c }))}
                    style={{ width:28, height:28, borderRadius:'50%', background:c, border: nuevaCarpeta.color === c ? '3px solid #1e293b' : '3px solid transparent', cursor:'pointer' }} />
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowNuevaCarpeta(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearCarpeta} disabled={!nuevaCarpeta.nombre}>Crear carpeta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
