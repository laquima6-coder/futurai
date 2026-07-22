import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const COLORES = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#22c55e','#06b6d4','#3b82f6']

export default function Calculadora({ user }) {
  const [materias, setMaterias] = useState([])
  const [notasMap, setNotasMap] = useState({})
  const [materiaActiva, setMateriaActiva] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showNotaModal, setShowNotaModal] = useState(false)
  const [nuevaMateria, setNuevaMateria] = useState({ nombre:'', color:'#6366f1', profesor:'', aula:'' })
  const [nuevaNota, setNuevaNota] = useState({ nombre:'', nota:'', peso:100, tipo:'parcial', fecha:'' })
  const uid = user.id

  useEffect(() => { cargarMaterias() }, [])
  useEffect(() => { if (materiaActiva) cargarNotas(materiaActiva.id) }, [materiaActiva])

  const cargarMaterias = async () => {
    const { data } = await supabase.from('futurai_materias').select('*').eq('user_id', uid).order('created_at')
    setMaterias(data || [])
    if (data?.length > 0) setMateriaActiva(data[0])
  }

  const cargarNotas = async (mId) => {
    const { data } = await supabase.from('futurai_notas_materia').select('*').eq('materia_id', mId).eq('user_id', uid).order('fecha')
    setNotasMap(p => ({ ...p, [mId]: data || [] }))
  }

  const crearMateria = async () => {
    const { data } = await supabase.from('futurai_materias').insert({ user_id: uid, ...nuevaMateria }).select().single()
    if (data) { setMaterias(p => [...p, data]); setMateriaActiva(data); setShowModal(false); setNuevaMateria({ nombre:'', color:'#6366f1', profesor:'', aula:'' }) }
  }

  const agregarNota = async () => {
    if (!materiaActiva) return
    const { data } = await supabase.from('futurai_notas_materia').insert({
      user_id: uid, materia_id: materiaActiva.id,
      ...nuevaNota, nota: parseFloat(nuevaNota.nota), peso: parseFloat(nuevaNota.peso)
    }).select().single()
    if (data) {
      setNotasMap(p => ({ ...p, [materiaActiva.id]: [...(p[materiaActiva.id] || []), data] }))
      setShowNotaModal(false)
      setNuevaNota({ nombre:'', nota:'', peso:100, tipo:'parcial', fecha:'' })
    }
  }

  const eliminarNota = async (id) => {
    await supabase.from('futurai_notas_materia').delete().eq('id', id)
    setNotasMap(p => ({ ...p, [materiaActiva.id]: p[materiaActiva.id].filter(n => n.id !== id) }))
  }

  const calcularPromedio = (notas) => {
    if (!notas || notas.length === 0) return null
    const notasValidas = notas.filter(n => n.nota !== null && n.nota !== undefined)
    if (notasValidas.length === 0) return null
    const totalPeso = notasValidas.reduce((s, n) => s + (n.peso || 100), 0)
    const suma = notasValidas.reduce((s, n) => s + (n.nota * (n.peso || 100)), 0)
    return (suma / totalPeso).toFixed(2)
  }

  const getColor = (prom) => {
    if (!prom) return '#94a3b8'
    const p = parseFloat(prom)
    if (p >= 8) return '#22c55e'
    if (p >= 6) return '#f59e0b'
    return '#ef4444'
  }

  const notasActivas = materiaActiva ? (notasMap[materiaActiva.id] || []) : []
  const promedioActivo = calcularPromedio(notasActivas)
  const promedioGeneral = materias.length > 0 ? (() => {
    const promedios = materias.map(m => parseFloat(calcularPromedio(notasMap[m.id] || []))).filter(p => !isNaN(p))
    return promedios.length > 0 ? (promedios.reduce((a,b) => a+b, 0) / promedios.length).toFixed(2) : null
  })() : null

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📐 Calculadora de promedio</div>
        <div className="page-subtitle">Controlá tus notas y promedio general</div>
      </div>

      {promedioGeneral && (
        <div className="card mb-24" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none' }}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div>
              <div style={{ fontSize:13, opacity:.8, marginBottom:4 }}>PROMEDIO GENERAL</div>
              <div style={{ fontSize:48, fontWeight:900, lineHeight:1 }}>{promedioGeneral}</div>
            </div>
            <div style={{ flex:1, fontSize:14, opacity:.85 }}>
              {materias.length} materia{materias.length !== 1 ? 's' : ''} registrada{materias.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:20 }}>
        {/* Materias */}
        <div style={{ width:260, flexShrink:0 }}>
          <button className="btn btn-primary w-full mb-12" onClick={() => setShowModal(true)}>+ Nueva materia</button>
          {materias.map(m => {
            const prom = calcularPromedio(notasMap[m.id] || [])
            return (
              <div key={m.id} onClick={() => setMateriaActiva(m)}
                className="card" style={{ marginBottom:8, cursor:'pointer', borderLeft:'4px solid ' + m.color,
                  background: materiaActiva?.id === m.id ? '#f8faff' : '#fff',
                  boxShadow: materiaActiva?.id === m.id ? '0 2px 12px rgba(99,102,241,.15)' : '' }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{m.nombre}</div>
                {m.profesor && <div style={{ fontSize:12, color:'#94a3b8' }}>Prof. {m.profesor}</div>}
                {prom && <div style={{ fontSize:20, fontWeight:800, color:getColor(prom), marginTop:6 }}>{prom}</div>}
              </div>
            )
          })}
        </div>

        {/* Notas de materia */}
        <div style={{ flex:1 }}>
          {materiaActiva ? (
            <>
              <div className="flex-between mb-16">
                <div>
                  <h2 style={{ fontSize:20, fontWeight:800, display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:12, height:12, borderRadius:'50%', background:materiaActiva.color, display:'inline-block' }} />
                    {materiaActiva.nombre}
                  </h2>
                  {promedioActivo && (
                    <div style={{ fontSize:28, fontWeight:900, color:getColor(promedioActivo) }}>
                      Promedio: {promedioActivo}
                    </div>
                  )}
                </div>
                <button className="btn btn-primary" onClick={() => setShowNotaModal(true)}>+ Agregar nota</button>
              </div>

              {notasActivas.length === 0 ? (
                <div className="empty-state card">
                  <div className="empty-icon">📊</div>
                  <p>No hay notas cargadas para esta materia</p>
                  <button className="btn btn-primary" style={{ marginTop:12 }} onClick={() => setShowNotaModal(true)}>+ Agregar nota</button>
                </div>
              ) : (
                <div className="card">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Evaluación</th>
                        <th>Tipo</th>
                        <th>Fecha</th>
                        <th>Peso %</th>
                        <th>Nota</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {notasActivas.map(n => (
                        <tr key={n.id}>
                          <td style={{ fontWeight:600 }}>{n.nombre}</td>
                          <td><span className="badge badge-primary">{n.tipo}</span></td>
                          <td className="text-muted">{n.fecha ? new Date(n.fecha).toLocaleDateString('es-AR') : '-'}</td>
                          <td className="text-muted">{n.peso}%</td>
                          <td style={{ fontWeight:800, fontSize:18, color:getColor(n.nota) }}>{n.nota ?? '-'}</td>
                          <td><button className="btn-icon" style={{ color:'#ef4444', borderColor:'#fecaca' }} onClick={() => eliminarNota(n.id)}>🗑️</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state card">
              <div className="empty-icon">📐</div>
              <p>Agregá tus materias para calcular promedios</p>
              <button className="btn btn-primary" style={{ marginTop:12 }} onClick={() => setShowModal(true)}>+ Nueva materia</button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><div className="modal-title">Nueva materia</div><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="form-group"><label>Nombre de la materia</label><input value={nuevaMateria.nombre} onChange={e => setNuevaMateria(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Cálculo I" /></div>
            <div className="grid-2">
              <div className="form-group"><label>Profesor</label><input value={nuevaMateria.profesor} onChange={e => setNuevaMateria(p => ({ ...p, profesor: e.target.value }))} placeholder="Nombre del profe" /></div>
              <div className="form-group"><label>Aula</label><input value={nuevaMateria.aula} onChange={e => setNuevaMateria(p => ({ ...p, aula: e.target.value }))} placeholder="Ej: A-204" /></div>
            </div>
            <div className="form-group"><label>Color</label><div style={{ display:'flex', gap:8 }}>{COLORES.map(c => <button key={c} onClick={() => setNuevaMateria(p => ({ ...p, color: c }))} style={{ width:28, height:28, borderRadius:'50%', background:c, border: nuevaMateria.color===c?'3px solid #1e293b':'3px solid transparent', cursor:'pointer' }} />)}</div></div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearMateria} disabled={!nuevaMateria.nombre}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {showNotaModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><div className="modal-title">Agregar nota</div><button className="modal-close" onClick={() => setShowNotaModal(false)}>✕</button></div>
            <div className="form-group"><label>Evaluación</label><input value={nuevaNota.nombre} onChange={e => setNuevaNota(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Primer parcial" /></div>
            <div className="grid-2">
              <div className="form-group"><label>Tipo</label><select value={nuevaNota.tipo} onChange={e => setNuevaNota(p => ({ ...p, tipo: e.target.value }))}><option value="parcial">Parcial</option><option value="final">Final</option><option value="tp">TP</option><option value="quiz">Quiz</option><option value="practica">Práctica</option></select></div>
              <div className="form-group"><label>Fecha</label><input type="date" value={nuevaNota.fecha} onChange={e => setNuevaNota(p => ({ ...p, fecha: e.target.value }))} /></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label>Nota (0-10)</label><input type="number" min="0" max="10" step="0.01" value={nuevaNota.nota} onChange={e => setNuevaNota(p => ({ ...p, nota: e.target.value }))} placeholder="7.5" /></div>
              <div className="form-group"><label>Peso %</label><input type="number" min="1" max="100" value={nuevaNota.peso} onChange={e => setNuevaNota(p => ({ ...p, peso: e.target.value }))} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowNotaModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={agregarNota} disabled={!nuevaNota.nombre || nuevaNota.nota === ''}>Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
