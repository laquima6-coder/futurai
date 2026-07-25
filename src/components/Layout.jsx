import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ADMIN_EMAIL = 'laquima6@gmail.com'

const navItems = [
  { to: '/', icon: '📊', label: 'Dashboard', section: 'principal' },
  { to: '/notas', icon: '📝', label: 'Notas', section: 'principal' },
  { to: '/flashcards', icon: '🃏', label: 'Flashcards', section: 'principal' },
  { to: '/calculadora', icon: '📐', label: 'Calculadora de promedio', section: 'principal' },
  { to: '/agenda', icon: '📅', label: 'Agenda', section: 'principal' },
  { to: '/calendario', icon: '🗓️', label: 'Calendario', section: 'herramientas' },
  { to: '/grabador', icon: '🎙️', label: 'Grabador de clases', section: 'herramientas' },
  { to: '/ocr', icon: '📷', label: 'OCR (foto → texto)', section: 'herramientas' },
  { to: '/traductor', icon: '🌐', label: 'Traductor', section: 'herramientas' },
  { to: '/resumidor', icon: '🤖', label: 'Resumidor IA', section: 'herramientas' },
  { to: '/qr', icon: '🔲', label: 'Generador de QR', section: 'herramientas' },
  { to: '/biblioteca', icon: '📚', label: 'Biblioteca', section: 'herramientas' },
  { to: '/mapa', icon: '🧠', label: 'Mapas conceptuales', section: 'herramientas' },
  { to: '/perfil', icon: '👤', label: 'Mi perfil', section: 'cuenta' },
]

export default function Layout({ user }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isAdmin = user?.email === ADMIN_EMAIL

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const initial = user?.email?.[0]?.toUpperCase() || '?'
  const sections = { principal: 'Principal', herramientas: 'Herramientas', cuenta: 'Cuenta' }

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:99 }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile header */}
      <div style={{ display:'none', position:'fixed',top:0,left:0,right:0,height:56,background:'#1e1b4b',zIndex:98,alignItems:'center',padding:'0 16px',gap:12 }} className="mobile-header">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background:'none',border:'none',color:'#fff',fontSize:22,cursor:'pointer' }}>☰</button>
        <span style={{ fontSize:18,fontWeight:800,background:'linear-gradient(135deg,#818cf8,#c4b5fd)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>futurAI</span>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">🎓 futurAI</div>
          <div className="sidebar-logo-sub">Tu asistente universitario</div>
        </div>

        {Object.entries(sections).map(([key, label]) => (
          <div key={key}>
            <div className="sidebar-section">{label}</div>
            {navItems.filter(i => i.section === key).map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            {key === 'cuenta' && isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <span className="nav-icon">⚙️</span>
                Panel Admin
                <span style={{ marginLeft:'auto', fontSize:9, background:'#f59e0b', color:'#fff', padding:'1px 6px', borderRadius:10, fontWeight:700 }}>ADMIN</span>
              </NavLink>
            )}
          </div>
        ))}

        <div className="sidebar-divider" />
        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">{initial}</div>
            <div className="user-info">
              <div className="user-name">{user?.email?.split('@')[0]}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width:'100%',marginTop:8,background:'#ffffff0d',border:'1px solid #ffffff15',color:'#94a3b8',borderRadius:8,padding:'8px',cursor:'pointer',fontSize:13,fontFamily:'inherit' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          .main-content { padding-top: 72px !important; }
        }
      `}</style>
    </div>
  )
}
