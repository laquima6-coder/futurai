import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({ notas: 0, flashcards: 0, materias: 0, eventos: 0 })
  const [eventos, setEventos] = useState([])
  const [recordatorios, setRecordatorios] = useState([])
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const uid = user.id
      const [n, f, m, ev, r, p] = await Promise.all([
        supabase.from('futurai_notas').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('futurai_flashcards').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('futurai_materias').select('id', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('futurai_eventos').select('*').eq('user_id', uid).gte('fecha_inicio', new Date().toISOString()).order('fecha_inicio').limit(5),
        supabase.from('futurai_recordatorios').select('*').eq('user_id', uid).eq('completado', false).order('fecha').limit(5),
        supabase.from('futurai_perfiles').select('*').eq('id', uid).single(),
      ])
      setStats({ notas: n.count || 0, flashcards: f.count || 0, materias: m.count || 0, eventos: ev.data?.length || 0 })
      setEventos(ev.data || [])
      setRecordatorios(r.data || [])
      setPerfil(p.data)
      setLoading(false)
    }
    load()
  }, [user.id])

  const hora = new Date().getHours()
  const saludo = hora < 12 ? '¡Buenos días' : hora < 19 ? '¡Buenas tardes' : '¡Buenas noches'
  const nombre = perfil?.nombre || user.email?.split('@')[0] || 'estudiante'

  if (loading) return <div className="spinner" />

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{saludo}, {nombre}! 👋</div>
        <div className="page-subtitle">Aquí tenés un resumen de tu actividad</div>
      </div>

      <div className="stats-grid">
        {[
          { icon: '📝', value: stats.notas, label: 'Notas', to: '/notas' },
          { icon: '🃏', value: stats.flashcards, label: 'Flashcards', to: '/flashcards' },
          { icon: '📚', value: stats.materias, label: 'Materias', to: '/calculadora' },
          { icon: '🗓️', value: stats.eventos, label: 'Próximos eventos', to: '/calendario' },
        ].map(s => (
          <Link to={s.to} key={s.label} style={{ textDecoration:'none' }}>
            <div className="stat-card" style={{ cursor:'pointer', transition:'.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform=''}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid-2">
        {/* Próximos eventos */}
        <div className="card">
          <div className="card-title">🗓️ Próximos eventos</div>
          {eventos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <p>No hay eventos próximos</p>
              <Link to="/calendario"><button className="btn btn-primary btn-sm" style={{ marginTop:12 }}>Agregar evento</button></Link>
            </div>
          ) : eventos.map(ev => (
            <div key={ev.id} className="list-item">
              <div style={{ width:10, height:10, borderRadius:'50%', background: ev.color, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{ev.titulo}</div>
                <div className="text-muted">{new Date(ev.fecha_inicio).toLocaleDateString('es-AR', { weekday:'short', day:'numeric', month:'short' })}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recordatorios */}
        <div className="card">
          <div className="card-title">⏰ Recordatorios pendientes</div>
          {recordatorios.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <p>Todo al día</p>
              <Link to="/agenda"><button className="btn btn-primary btn-sm" style={{ marginTop:12 }}>Agregar recordatorio</button></Link>
            </div>
          ) : recordatorios.map(r => (
            <div key={r.id} className="list-item">
              <span>{r.prioridad === 'alta' ? '🔴' : r.prioridad === 'media' ? '🟡' : '🟢'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{r.titulo}</div>
                <div className="text-muted">{new Date(r.fecha).toLocaleDateString('es-AR', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ marginTop:16 }}>
        <div className="card-title">⚡ Accesos rápidos</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
          {[
            { to:'/notas', icon:'📝', label:'Nueva nota' },
            { to:'/flashcards', icon:'🃏', label:'Estudiar flashcards' },
            { to:'/grabador', icon:'🎙️', label:'Grabar clase' },
            { to:'/ocr', icon:'📷', label:'Sacar foto al texto' },
            { to:'/calculadora', icon:'📐', label:'Calcular promedio' },
            { to:'/mapa', icon:'🧠', label:'Mapa conceptual' },
          ].map(a => (
            <Link to={a.to} key={a.to} style={{ textDecoration:'none' }}>
              <button className="btn btn-outline">{a.icon} {a.label}</button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
