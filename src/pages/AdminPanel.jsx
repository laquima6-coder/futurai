import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3b3ZmbHNhZ2hudXR5c2p5YXVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY2NzQ3NSwiZXhwIjoyMDk2MjQzNDc1fQ.EEtIVeMFSPt3xgIBy0aPm0O1IRPFOp7zpKZRSET7Otw'
const SB_URL = 'https://fwovflsaghnutysjyaus.supabase.co'

export default function AdminPanel() {
  const [stats, setStats] = useState({ usuarios: 0, notas: 0, flashcards: 0, eventos: 0 })
  const [usuarios, setUsuarios] = useState([])
  const [perfiles, setPerfiles] = useState([])
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    // Use service key to get all data
    const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    const base = SB_URL + '/rest/v1'

    const [uRes, pRes, nRes, fRes, evRes] = await Promise.all([
      fetch(`${base}/futurai_perfiles?select=*&order=created_at.desc`, { headers }),
      fetch(`${base}/futurai_notas?select=id,user_id&head=true&prefer=count=exact`, { headers }),
      fetch(`${base}/futurai_flashcards?select=id,user_id&head=true&prefer=count=exact`, { headers }),
      fetch(`${base}/futurai_eventos?select=id,user_id&head=true&prefer=count=exact`, { headers }),
      fetch(`${base}/futurai_perfiles?select=count&head=true&prefer=count=exact`, { headers }),
    ])

    const perfilesData = await uRes.json()
    setPerfiles(perfilesData || [])
    setStats({
      usuarios: parseInt(evRes.headers.get('content-range')?.split('/')[1] || 0),
      notas: parseInt(pRes.headers.get('content-range')?.split('/')[1] || 0),
      flashcards: parseInt(fRes.headers.get('content-range')?.split('/')[1] || 0),
      eventos: parseInt(nRes.headers.get('content-range')?.split('/')[1] || 0),
    })
    setLoading(false)
  }

  if (loading) return <div className="spinner" />

  return (
    <div>
      <div className="page-header">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="page-title">⚙️ Panel Admin</div>
          <span className="admin-badge">ADMIN</span>
        </div>
        <div className="page-subtitle">Solo visible para laquima6@gmail.com</div>
      </div>

      <div className="tabs">
        {['dashboard','usuarios'].map(t => (
          <button key={t} className={`tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {t === 'dashboard' ? '📊 Dashboard' : '👥 Usuarios'}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="stats-grid mb-24">
            {[
              { icon:'👥', value: perfiles.length, label:'Estudiantes registrados' },
              { icon:'📝', value: stats.notas, label:'Notas creadas' },
              { icon:'🃏', value: stats.flashcards, label:'Flashcards' },
              { icon:'🗓️', value: stats.eventos, label:'Eventos' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">📈 Últimos registros</div>
            {perfiles.slice(0,5).map(p => (
              <div key={p.id} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f1f5f9' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700 }}>
                  {(p.nombre || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:600 }}>{p.nombre} {p.apellido} {(!p.nombre && !p.apellido) && <span className="text-muted">Sin perfil</span>}</div>
                  <div style={{ fontSize:12, color:'#94a3b8' }}>{p.universidad || '-'} · {p.carrera || '-'}</div>
                </div>
                <div style={{ marginLeft:'auto', fontSize:12, color:'#94a3b8' }}>
                  {new Date(p.created_at).toLocaleDateString('es-AR')}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'usuarios' && (
        <div className="card">
          <div className="flex-between mb-16">
            <div className="card-title" style={{ margin:0 }}>👥 Todos los estudiantes ({perfiles.length})</div>
            <button className="btn btn-outline btn-sm" onClick={cargar}>🔄 Actualizar</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Universidad</th>
                  <th>Carrera</th>
                  <th>Año</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {perfiles.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight:600 }}>{p.nombre} {p.apellido}</div>
                      <div style={{ fontSize:12, color:'#94a3b8' }}>{p.id.slice(0,8)}...</div>
                    </td>
                    <td className="text-muted">{p.universidad || '-'}</td>
                    <td className="text-muted">{p.carrera || '-'}</td>
                    <td className="text-muted">{p.anio_cursada ? `${p.anio_cursada}°` : '-'}</td>
                    <td className="text-muted">{new Date(p.created_at).toLocaleDateString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
