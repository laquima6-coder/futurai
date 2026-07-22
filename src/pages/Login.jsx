import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('futurai_perfiles').upsert({
            id: data.user.id,
            nombre: nombre.split(' ')[0] || '',
            apellido: nombre.split(' ').slice(1).join(' ') || '',
          })
        }
        setSuccess('¡Cuenta creada! Revisá tu email para confirmar.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ fontSize:48, marginBottom:8 }}>🎓</div>
          <div className="login-logo-title">futurAI</div>
          <div className="login-logo-sub">Tu asistente universitario con IA</div>
        </div>

        <div className="tabs">
          <button className={`tab ${mode==='login'?'active':''}`} onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>Iniciar sesión</button>
          <button className={`tab ${mode==='register'?'active':''}`} onClick={() => { setMode('register'); setError(''); setSuccess(''); }}>Registrarse</button>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Nombre completo</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" required />
            </div>
          )}
          <div className="form-group">
            <label>Email universitario</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@universidad.edu" required />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:15 }}>
            {loading ? '⏳ Cargando...' : mode === 'login' ? '🚀 Ingresar' : '✨ Crear cuenta'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:'#94a3b8' }}>
          🔒 Tus datos están protegidos con Supabase Auth
        </p>
      </div>
    </div>
  )
}
