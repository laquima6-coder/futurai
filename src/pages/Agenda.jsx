import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Agenda({ user }) {
  const [recordatorios, setRecordatorios] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [filtro, setFiltro] = useState('pendiente')
  const [nuevo, setNuevo] = useState({ titulo:'', descripcion:'', fecha:'', prioridad:'media' })
  const uid = user.id

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const { data } = await supabase.from('futurai_recordatorios').select('*').eq('user_id', uid).order('fecha')
    setRecordatorios(data || [])
  }

  const crear = async () => {
    const { data } = await supabase.from('futurai_recordatorios').insert({ user_id: uid, ...nuevo }).select().single()
    if (data) { setRecordatorios(p => [...p, data].sort((a,b) => new Date(a.fecha)-new Date(b.fecha))); setShowModal(false); setNuevo({ titulo:'', descripcion:'', fecha:'', prioridad:'media' }) }
  }

  const toggleCompletado = async (id, val) => {
    await supabase.from('futurai_recordatorios').update({ completado: val }).eq('id', id)
    setRecordatorios(p => p.map(r => r.id === id ? { ...r, completado: val } : r))
  }

  const eliminar = async (id) => {
    await supabase.from('futurai_recordatorios').delete().eq('id', id)
    setRecordatorios(p => p.filter(r => r.id !== id))
  }

  const prioridadIcon = { alta:'🔴', media:'🟡', baja:'🟢' }
  const prioridadLabel = { alta:'Alta', media:'Media', baja:'Baja' }

  const filtrados = recordatorios.filter(r =>
    filtro === 'todos' ? true :
    filtro === 'pendiente' ? !r.completado :
    r.completado
  )

  const pendientes = recordatorios.filter(r => !r.completado).length

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📅 Agenda</div>
        <div className="page-subtitle">{pendientes} recordatorio{pendientes !== 1 ? 's' : ''} pendiente{pendientes !== 1 ? 's' : ''}</div>
      </div>

      <div className="flex-between mb-24">
        <div className="tabs" style={{ width:'auto', marginBottom:0 }}>
          {['pendiente','completado','todos'].map(f => (
            <button key={f} className={`tab ${filtro === f ? 'active' : ''}`} onClick={() => setFiltro(f)}>
              {f === 'pendiente' ? '⏳ Pendientes' : f === 'completado' ? '✅ Completados' : '📋 Todos'}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo recordatorio</button>
      </div>

      {filtrados.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">📅</div>
          <p>{filtro === 'pendiente' ? '¡Todo al día! No hay recordatorios pendientes.' : 'No hay recordatorios en esta categoría.'}</p>
          <button className="btn btn-primary" style={{ marginTop:12 }} onClick={() => setShowModal(true)}>+ Agregar recordatorio</button>
        </div>
      ) : filtrados.map(r => {
        const vencido = !r.completado && new Date(r.fecha) < new Date()
        return (
          <div key={r.id} className="card" style={{ marginBottom:10, display:'flex', alignItems:'flex-start', gap:14,
            borderLeft: `4px solid ${r.prioridad==='alta'?'#ef4444':r.prioridad==='media'?'#f59e0b':'#22c55e'}`,
            opacity: r.completado ? .6 : 1 }}>
            <input type="checkbox" checked={r.completado} onChange={e => toggleCompletado(r.id, e.target.checked)}
              style={{ width:18, height:18, marginTop:2, cursor:'pointer', accentColor:'#6366f1' }} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, textDecoration: r.completado ? 'line-through' : 'none' }}>{r.titulo}</div>
              {r.descripcion && <div className="text-muted mt-8">{r.descripcion}</div>}
              <div style={{ display:'flex', gap:10, marginTop:8, alignItems:'center' }}>
                <span style={{ fontSize:12, color: vencido ? '#ef4444' : '#94a3b8', fontWeight: vencido ? 700 : 400 }}>
                  {vencido ? '⚠️ Vencido · ' : '📅 '}{new Date(r.fecha).toLocaleDateString('es-AR', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                </span>
                <span className={`badge ${r.prioridad==='alta'?'badge-danger':r.prioridad==='media'?'badge-warning':'badge-success'}`}>
                  {prioridadIcon[r.prioridad]} {prioridadLabel[r.prioridad]}
                </span>
              </div>
            </div>
            <button className="btn-icon" onClick={() => { if(confirm('¿Eliminar?')) eliminar(r.id) }}>🗑️</button>
          </div>
        )
      })}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><div className="modal-title">Nuevo recordatorio</div><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="form-group"><label>Título</label><input value={nuevo.titulo} onChange={e => setNuevo(p => ({ ...p, titulo: e.target.value }))} placeholder="¿Qué tenés que hacer?" /></div>
            <div className="form-group"><label>Descripción (opcional)</label><textarea value={nuevo.descripcion} onChange={e => setNuevo(p => ({ ...p, descripcion: e.target.value }))} style={{ minHeight:60 }} /></div>
            <div className="grid-2">
              <div className="form-group"><label>Fecha y hora</label><input type="datetime-local" value={nuevo.fecha} onChange={e => setNuevo(p => ({ ...p, fecha: e.target.value }))} /></div>
              <div className="form-group"><label>Prioridad</label>
                <select value={nuevo.prioridad} onChange={e => setNuevo(p => ({ ...p, prioridad: e.target.value }))}>
                  <option value="alta">🔴 Alta</option>
                  <option value="media">🟡 Media</option>
                  <option value="baja">🟢 Baja</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crear} disabled={!nuevo.titulo || !nuevo.fecha}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
