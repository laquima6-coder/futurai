import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Calendario({ user }) {
  const [fecha, setFecha] = useState(new Date())
  const [eventos, setEventos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [nuevo, setNuevo] = useState({ titulo:'', descripcion:'', fecha_inicio:'', color:'#6366f1', tipo:'evento' })
  const uid = user.id

  useEffect(() => { cargar() }, [fecha])

  const cargar = async () => {
    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1).toISOString()
    const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59).toISOString()
    const { data } = await supabase.from('futurai_eventos').select('*').eq('user_id', uid).gte('fecha_inicio', inicio).lte('fecha_inicio', fin).order('fecha_inicio')
    setEventos(data || [])
  }

  const crear = async () => {
    const { data } = await supabase.from('futurai_eventos').insert({ user_id: uid, ...nuevo }).select().single()
    if (data) { setEventos(p => [...p, data]); setShowModal(false); setNuevo({ titulo:'', descripcion:'', fecha_inicio:'', color:'#6366f1', tipo:'evento' }) }
  }

  const eliminar = async (id) => {
    await supabase.from('futurai_eventos').delete().eq('id', id)
    setEventos(p => p.filter(e => e.id !== id))
  }

  const diasDelMes = () => {
    const primero = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
    const ultimo = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
    const dias = []
    for (let i = 0; i < primero.getDay(); i++) dias.push(null)
    for (let d = 1; d <= ultimo.getDate(); d++) dias.push(d)
    return dias
  }

  const eventosDelDia = (dia) => {
    if (!dia) return []
    return eventos.filter(e => {
      const d = new Date(e.fecha_inicio)
      return d.getDate() === dia && d.getMonth() === fecha.getMonth() && d.getFullYear() === fecha.getFullYear()
    })
  }

  const hoy = new Date()
  const esHoy = (dia) => dia && dia === hoy.getDate() && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()

  const eventosDiaSeleccionado = diaSeleccionado ? eventosDelDia(diaSeleccionado) : []
  const colores = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#22c55e','#06b6d4','#3b82f6']

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🗓️ Calendario</div>
        <div className="page-subtitle">Organizá tus fechas importantes</div>
      </div>

      <div className="grid-2" style={{ alignItems:'start' }}>
        <div className="card">
          {/* Nav mes */}
          <div className="flex-between mb-16">
            <button className="btn-icon" onClick={() => setFecha(new Date(fecha.getFullYear(), fecha.getMonth()-1, 1))}>‹</button>
            <div style={{ fontWeight:800, fontSize:18 }}>{MESES[fecha.getMonth()]} {fecha.getFullYear()}</div>
            <button className="btn-icon" onClick={() => setFecha(new Date(fecha.getFullYear(), fecha.getMonth()+1, 1))}>›</button>
          </div>
          {/* Cabecera días */}
          <div className="calendar-grid" style={{ marginBottom:8 }}>
            {DIAS.map(d => <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color:'#94a3b8', padding:4 }}>{d}</div>)}
          </div>
          {/* Días */}
          <div className="calendar-grid">
            {diasDelMes().map((dia, i) => {
              const evs = eventosDelDia(dia)
              return (
                <div key={i} onClick={() => dia && setDiaSeleccionado(dia)}
                  className={`cal-day ${esHoy(dia)?'today':''} ${diaSeleccionado===dia&&!esHoy(dia)?'selected':''} ${!dia?'other-month':''}`}
                  style={{ flexDirection:'column', gap:2, position:'relative',
                    background: diaSeleccionado===dia&&!esHoy(dia)?'#eef2ff':'',
                    color: diaSeleccionado===dia&&!esHoy(dia)?'#6366f1':'' }}>
                  {dia}
                  {evs.length > 0 && <div style={{ display:'flex', gap:2, justifyContent:'center' }}>
                    {evs.slice(0,3).map(e => <div key={e.id} style={{ width:5, height:5, borderRadius:'50%', background:e.color }} />)}
                  </div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Eventos del día seleccionado */}
        <div>
          <div className="flex-between mb-16">
            <div style={{ fontWeight:700, fontSize:15 }}>
              {diaSeleccionado ? `${diaSeleccionado} de ${MESES[fecha.getMonth()]}` : 'Seleccioná un día'}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => {
              setNuevo(p => ({ ...p, fecha_inicio: diaSeleccionado ? `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(diaSeleccionado).padStart(2,'0')}T09:00` : '' }))
              setShowModal(true)
            }}>+ Evento</button>
          </div>

          {eventosDiaSeleccionado.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">📅</div>
              <p style={{ fontSize:13 }}>{diaSeleccionado ? 'Sin eventos este día' : 'Seleccioná un día para ver eventos'}</p>
            </div>
          ) : eventosDiaSeleccionado.map(ev => (
            <div key={ev.id} className="card" style={{ marginBottom:10, borderLeft:'4px solid ' + ev.color }}>
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight:700 }}>{ev.titulo}</div>
                  <div style={{ fontSize:12, color:'#94a3b8', marginTop:3 }}>
                    {new Date(ev.fecha_inicio).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' })}
                    {' · '}<span className="badge badge-primary">{ev.tipo}</span>
                  </div>
                  {ev.descripcion && <div className="text-muted mt-8">{ev.descripcion}</div>}
                </div>
                <button className="btn-icon" onClick={() => { if(confirm('¿Eliminar?')) eliminar(ev.id) }}>🗑️</button>
              </div>
            </div>
          ))}

          {/* Próximos eventos */}
          <div className="card" style={{ marginTop:16 }}>
            <div className="card-title">📋 Todos los eventos del mes</div>
            {eventos.length === 0 ? <div className="text-muted" style={{ fontSize:13 }}>No hay eventos este mes</div>
              : eventos.map(ev => (
                <div key={ev.id} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:ev.color, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{ev.titulo}</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>{new Date(ev.fecha_inicio).toLocaleDateString('es-AR', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><div className="modal-title">Nuevo evento</div><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="form-group"><label>Título</label><input value={nuevo.titulo} onChange={e => setNuevo(p => ({ ...p, titulo: e.target.value }))} placeholder="Ej: Parcial de Física" /></div>
            <div className="form-group"><label>Descripción</label><textarea value={nuevo.descripcion} onChange={e => setNuevo(p => ({ ...p, descripcion: e.target.value }))} style={{ minHeight:60 }} /></div>
            <div className="grid-2">
              <div className="form-group"><label>Fecha y hora</label><input type="datetime-local" value={nuevo.fecha_inicio} onChange={e => setNuevo(p => ({ ...p, fecha_inicio: e.target.value }))} /></div>
              <div className="form-group"><label>Tipo</label>
                <select value={nuevo.tipo} onChange={e => setNuevo(p => ({ ...p, tipo: e.target.value }))}>
                  <option value="examen">Examen</option>
                  <option value="parcial">Parcial</option>
                  <option value="tp">TP/Entrega</option>
                  <option value="clase">Clase especial</option>
                  <option value="evento">Evento</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label>Color</label><div style={{ display:'flex', gap:8 }}>{colores.map(c => <button key={c} onClick={() => setNuevo(p => ({ ...p, color: c }))} style={{ width:28, height:28, borderRadius:'50%', background:c, border: nuevo.color===c?'3px solid #1e293b':'3px solid transparent', cursor:'pointer' }} />)}</div></div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crear} disabled={!nuevo.titulo || !nuevo.fecha_inicio}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
