import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Biblioteca({ user }) {
  const [archivos, setArchivos] = useState([])
  const [subiendo, setSubiendo] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const fileRef = useRef()
  const uid = user.id

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const { data } = await supabase.storage.from('futurai-files').list(uid, { sortBy: { column: 'created_at', order: 'desc' } })
    if (data) setArchivos(data.filter(f => f.name !== '.emptyFolderPlaceholder'))
  }

  const subir = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setSubiendo(true)
    for (const file of files) {
      const path = `${uid}/${Date.now()}-${file.name}`
      await supabase.storage.from('futurai-files').upload(path, file)
    }
    await cargar()
    setSubiendo(false)
  }

  const descargar = async (nombre) => {
    const { data } = await supabase.storage.from('futurai-files').createSignedUrl(`${uid}/${nombre}`, 60)
    if (data) window.open(data.signedUrl)
  }

  const eliminar = async (nombre) => {
    await supabase.storage.from('futurai-files').remove([`${uid}/${nombre}`])
    setArchivos(p => p.filter(f => f.name !== nombre))
  }

  const iconoPorTipo = (nombre) => {
    const ext = nombre.split('.').pop().toLowerCase()
    if (['pdf'].includes(ext)) return '📄'
    if (['doc','docx'].includes(ext)) return '📝'
    if (['xls','xlsx'].includes(ext)) return '📊'
    if (['ppt','pptx'].includes(ext)) return '📊'
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '🖼️'
    if (['mp3','mp4','wav'].includes(ext)) return '🎵'
    if (['zip','rar'].includes(ext)) return '📦'
    return '📎'
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB'
    return (bytes/1024/1024).toFixed(1) + ' MB'
  }

  const filtrados = archivos.filter(f => f.name.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📚 Biblioteca</div>
        <div className="page-subtitle">Tus apuntes y materiales en la nube</div>
      </div>

      <div className="flex-between mb-24">
        <input placeholder="🔍 Buscar archivos..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ maxWidth:300 }} />
        <button className="btn btn-primary" onClick={() => fileRef.current.click()} disabled={subiendo}>
          {subiendo ? '⏳ Subiendo...' : '⬆️ Subir archivos'}
        </button>
        <input ref={fileRef} type="file" multiple style={{ display:'none' }} onChange={subir} />
      </div>

      {filtrados.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">📚</div>
          <p>{busqueda ? 'No se encontraron archivos' : 'Subí tus apuntes y materiales de estudio'}</p>
          <button className="btn btn-primary" style={{ marginTop:12 }} onClick={() => fileRef.current.click()}>⬆️ Subir primer archivo</button>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Archivo</th><th>Tamaño</th><th>Fecha</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtrados.map(f => (
                <tr key={f.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:24 }}>{iconoPorTipo(f.name)}</span>
                      <span style={{ fontWeight:600 }}>{f.name.replace(/^\d+-/, '')}</span>
                    </div>
                  </td>
                  <td className="text-muted">{formatBytes(f.metadata?.size)}</td>
                  <td className="text-muted">{f.created_at ? new Date(f.created_at).toLocaleDateString('es-AR') : '-'}</td>
                  <td>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => descargar(f.name)}>⬇️</button>
                      <button className="btn-icon" style={{ color:'#ef4444', borderColor:'#fecaca' }} onClick={() => { if(confirm('¿Eliminar?')) eliminar(f.name) }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="alert alert-info" style={{ marginTop:16 }}>
        💡 Los archivos se guardan en tu nube personal de Supabase.
      </div>
    </div>
  )
}
