import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Notas from './pages/Notas'
import Flashcards from './pages/Flashcards'
import Calculadora from './pages/Calculadora'
import Agenda from './pages/Agenda'
import Calendario from './pages/Calendario'
import Grabador from './pages/Grabador'
import OCR from './pages/OCR'
import QRGenerator from './pages/QRGenerator'
import Biblioteca from './pages/Biblioteca'
import MapaConceptual from './pages/MapaConceptual'
import Traductor from './pages/Traductor'
import Resumidor from './pages/Resumidor'
import BuscadorLibros from './pages/BuscadorLibros'
import Perfil from './pages/Perfil'
import AdminPanel from './pages/AdminPanel'

const ADMIN_EMAIL = 'laquima6@gmail.com'

function ProtectedRoute({ children, user }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children, user }) {
  if (!user) return <Navigate to="/login" replace />
  if (user.email !== ADMIN_EMAIL) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#1e1b4b' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🎓</div>
        <div style={{ color:'#c7d2fe', fontSize:22, fontWeight:800 }}>futurAI</div>
        <div className="spinner" style={{ borderTopColor:'#818cf8', margin:'20px auto 0' }} />
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute user={user}><Layout user={user} /></ProtectedRoute>}>
          <Route index element={<Dashboard user={user} />} />
          <Route path="notas" element={<Notas user={user} />} />
          <Route path="flashcards" element={<Flashcards user={user} />} />
          <Route path="calculadora" element={<Calculadora user={user} />} />
          <Route path="agenda" element={<Agenda user={user} />} />
          <Route path="calendario" element={<Calendario user={user} />} />
          <Route path="grabador" element={<Grabador user={user} />} />
          <Route path="ocr" element={<OCR user={user} />} />
          <Route path="qr" element={<QRGenerator user={user} />} />
          <Route path="biblioteca" element={<Biblioteca user={user} />} />
          <Route path="mapa" element={<MapaConceptual user={user} />} />
          <Route path="traductor" element={<Traductor user={user} />} />
          <Route path="resumidor" element={<Resumidor user={user} />} />
          <Route path="libros" element={<BuscadorLibros user={user} />} />
          <Route path="perfil" element={<Perfil user={user} />} />
          <Route path="admin" element={<AdminRoute user={user}><AdminPanel user={user} /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
