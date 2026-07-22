import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Perfil({ user }) {
  const [perfil, setPerfil] = useState({ nombre:'', apellido:'', universidad:'', carrera:'', anio_cursada:1 })
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    supabase.from('futurai_perfiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) setPerfil(data)
    })
  }, [user.id])

  const guardar = async () => {
    setGuardando(true); setOk(false)
    await supabase.from('futurai_perfiles').upsert({ id: user.id, ...perfil })
    setGuardando(false); setOk(true)
    setTimeout(() => setOk(false), 3000)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">👤 Mi perfil</div>
        <div className="page-subtitle">Configurá tu información de estudiante</div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, color:'#fff', fontWeight:800, margin:'0 auto 12px' }}>
              {perfil.nombre?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ fontWeight:800, fontSize:18 }}>{perfil.nombre} {perfil.apellido}</div>
            <div style={{ color:'#94a3b8', fontSize:13 }}>{user.email}</div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Nombre</label>
              <input value={perfil.nombre || ''} onChange={e => setPerfil(p => ({ ...p, nombre: e.target.value }))} placeholder="Tu nombre" />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input value={perfil.apellido || ''} onChange={e => setPerfil(p => ({ ...p, apellido: e.target.value }))} placeholder="Tu apellido" />
            </div>
          </div>
          <div className="form-group">
            <label>Universidad</label>
            <input value={perfil.universidad || ''} onChange={e => setPerfil(p => ({ ...p, universidad: e.target.value }))} placeholder="Ej: UBA, UTN, UNLP..." />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Carrera</label>
              <input value={perfil.carrera || ''} onChange={e => setPerfil(p => ({ ...p, carrera: e.target.value }))} placeholder="Ej: Ingeniería" />
            </div>
            <div className="form-group">
              <label>Año que cursás</label>
              <select value={perfil.anio_cursada || 1} onChange={e => setPerfil(p => ({ ...p, anio_cursada: Number(e.target.value) }))}>
                {[1,2,3,4,5,6].map(y => <option key={y} value={y}>{y}° año</option>)}
              </select>
            </div>
          </div>

          {ok && <div className="alert alert-success">✅ Perfil guardado</div>}
          <button className="btn btn-primary w-full" onClick={guardar} disabled={guardando} style={{ justifyContent:'center' }}>
            {guardando ? '⏳ Guardando...' : '💾 Guardar cambios'}
          </button>
        </div>

        <div>
          <div className="card">
            <div className="card-title">🔒 Seguridad</div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontWeight:600, marginBottom:4 }}>Email</div>
              <div style={{ color:'#64748b', fontSize:14 }}>{user.email}</div>
            </div>
            <button className="btn btn-outline w-full" style={{ justifyContent:'center' }} onClick={async () => {
              await supabase.auth.resetPasswordForEmail(user.email)
              alert('Te enviamos un email para cambiar tu contraseña')
            }}>📧 Cambiar contraseña</button>
          </div>

          <div className="card" style={{ marginTop:16 }}>
            <div className="card-title">⚠️ Zona peligrosa</div>
            <p className="text-muted" style={{ marginBottom:16 }}>Estas acciones son irreversibles.</p>
            <button className="btn btn-danger w-full" style={{ justifyContent:'center' }} onClick={async () => {
              if (confirm('¿Cerrar sesión en todos los dispositivos?')) {
                await supabase.auth.signOut({ scope: 'global' })
              }
            }}>🚪 Cerrar sesión en todos los dispositivos</button>
          </div>
        </div>
      </div>
    </div>
  )
}
