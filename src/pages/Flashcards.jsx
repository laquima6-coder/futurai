import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Flashcards({ user }) {
  const [sets, setSets] = useState([])
  const [cards, setCards] = useState([])
  const [setActivo, setSetActivo] = useState(null)
  const [modoEstudio, setModoEstudio] = useState(false)
  const [cardIdx, setCardIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [nuevoSet, setNuevoSet] = useState({ titulo: '', materia: '', color: '#6366f1' })
  const [nuevaCard, setNuevaCard] = useState({ pregunta: '', respuesta: '' })
  const uid = user.id

  useEffect(() => { cargarSets() }, [])
  useEffect(() => { if (setActivo) cargarCards(setActivo.id) }, [setActivo])

  const cargarSets = async () => {
    const { data } = await supabase.from('futurai_flashcard_sets').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    setSets(data || [])
    if (data?.length > 0 && !setActivo) setSetActivo(data[0])
  }

  const cargarCards = async (setId) => {
    const { data } = await supabase.from('futurai_flashcards').select('*').eq('set_id', setId).eq('user_id', uid).order('created_at')
    setCards(data || [])
  }

  const crearSet = async () => {
    const { data } = await supabase.from('futurai_flashcard_sets').insert({ user_id: uid, ...nuevoSet }).select().single()
    if (data) { setSets(p => [data, ...p]); setSetActivo(data); setShowModal(false); setNuevoSet({ titulo: '', materia: '', color: '#6366f1' }) }
  }

  const crearCard = async () => {
    if (!setActivo) return
    const { data } = await supabase.from('futurai_flashcards').insert({ user_id: uid, set_id: setActivo.id, ...nuevaCard }).select().single()
    if (data) { setCards(p => [...p, data]); setShowCardModal(false); setNuevaCard({ pregunta: '', respuesta: '' }) }
  }

  const eliminarCard = async (id) => {
    await supabase.from('futurai_flashcards').delete().eq('id', id)
    setCards(p => p.filter(c => c.id !== id))
  }

  const colores = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#22c55e','#06b6d4','#3b82f6']

  if (modoEstudio && cards.length > 0) {
    const card = cards[cardIdx]
    return (
      <div>
        <div className="flex-between mb-24">
          <div>
            <div className="page-title">🃏 Estudiando: {setActivo?.titulo}</div>
            <div className="page-subtitle">Tarjeta {cardIdx + 1} de {cards.length}</div>
          </div>
          <button className="btn btn-outline" onClick={() => { setModoEstudio(false); setCardIdx(0); setFlipped(false) }}>✕ Salir</button>
        </div>

        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <div className="progress mb-24">
            <div className="progress-bar" style={{ width: `${((cardIdx+1)/cards.length)*100}%` }} />
          </div>

          <div className="flashcard-flip" style={{ height:300 }} onClick={() => setFlipped(!flipped)}>
            <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`} style={{ height:'100%' }}>
              <div className="flashcard-front card flex-center" style={{ height:'100%', flexDirection:'column', background: setActivo?.color || '#6366f1', color:'#fff', border:'none', cursor:'pointer' }}>
                <div style={{ fontSize:13, opacity:.8, marginBottom:12, textTransform:'uppercase', letterSpacing:1 }}>PREGUNTA</div>
                <div style={{ fontSize:20, fontWeight:700, textAlign:'center', lineHeight:1.4 }}>{card.pregunta}</div>
                <div style={{ fontSize:12, marginTop:20, opacity:.7 }}>Tocá para ver la respuesta</div>
              </div>
              <div className="flashcard-back card flex-center" style={{ height:'100%', flexDirection:'column', background:'#fff', border:'2px solid ' + (setActivo?.color || '#6366f1'), cursor:'pointer' }}>
                <div style={{ fontSize:13, color:'#94a3b8', marginBottom:12, textTransform:'uppercase', letterSpacing:1 }}>RESPUESTA</div>
                <div style={{ fontSize:18, fontWeight:600, textAlign:'center', lineHeight:1.5, color:'#1e293b' }}>{card.respuesta}</div>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:24 }}>
            <button className="btn btn-outline" disabled={cardIdx === 0} onClick={() => { setCardIdx(p => p-1); setFlipped(false) }}>← Anterior</button>
            <button className="btn btn-danger btn-sm" onClick={() => {}}>😕 Difícil</button>
            <button className="btn btn-success btn-sm" onClick={() => {}}>😊 Fácil</button>
            {cardIdx < cards.length - 1
              ? <button className="btn btn-primary" onClick={() => { setCardIdx(p => p+1); setFlipped(false) }}>Siguiente →</button>
              : <button className="btn btn-success" onClick={() => { setCardIdx(0); setFlipped(false) }}>🔄 Reiniciar</button>
            }
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🃏 Flashcards</div>
        <div className="page-subtitle">Estudiá con tarjetas de memoria</div>
      </div>

      <div style={{ display:'flex', gap:20 }}>
        {/* Sets sidebar */}
        <div style={{ width:260, flexShrink:0 }}>
          <button className="btn btn-primary w-full" style={{ marginBottom:12 }} onClick={() => setShowModal(true)}>+ Nuevo mazo</button>
          {sets.length === 0 ? (
            <div className="empty-state"><p style={{ fontSize:13 }}>No hay mazos aún</p></div>
          ) : sets.map(s => (
            <div key={s.id} onClick={() => setSetActivo(s)}
              className="card" style={{ marginBottom:8, cursor:'pointer', border: setActivo?.id === s.id ? '2px solid ' + s.color : '1px solid #e2e8f0', transition:'.15s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:s.color, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{s.titulo}</div>
                  {s.materia && <div style={{ fontSize:12, color:'#94a3b8' }}>{s.materia}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cards panel */}
        <div style={{ flex:1 }}>
          {setActivo ? (
            <>
              <div className="flex-between mb-16">
                <div>
                  <h2 style={{ fontSize:20, fontWeight:800 }}>{setActivo.titulo}</h2>
                  <div className="text-muted">{cards.length} tarjetas</div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-outline" onClick={() => setShowCardModal(true)}>+ Agregar tarjeta</button>
                  {cards.length > 0 && (
                    <button className="btn btn-primary" onClick={() => { setModoEstudio(true); setCardIdx(0); setFlipped(false) }}>▶ Estudiar</button>
                  )}
                </div>
              </div>

              {cards.length === 0 ? (
                <div className="empty-state card">
                  <div className="empty-icon">🃏</div>
                  <p>No hay tarjetas en este mazo</p>
                  <button className="btn btn-primary" style={{ marginTop:12 }} onClick={() => setShowCardModal(true)}>+ Agregar tarjeta</button>
                </div>
              ) : (
                <div className="grid-2">
                  {cards.map(c => (
                    <div key={c.id} className="card" style={{ borderLeft: '4px solid ' + (setActivo?.color || '#6366f1') }}>
                      <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>P: {c.pregunta}</div>
                      <div style={{ color:'#64748b', fontSize:13 }}>R: {c.respuesta}</div>
                      <button className="btn-icon" style={{ marginTop:10, color:'#ef4444', borderColor:'#fecaca' }}
                        onClick={() => { if(confirm('¿Eliminar?')) eliminarCard(c.id) }}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state card">
              <div className="empty-icon">🃏</div>
              <p>Creá tu primer mazo de flashcards</p>
              <button className="btn btn-primary" style={{ marginTop:12 }} onClick={() => setShowModal(true)}>+ Nuevo mazo</button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Nuevo mazo</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>Título del mazo</label>
              <input value={nuevoSet.titulo} onChange={e => setNuevoSet(p => ({ ...p, titulo: e.target.value }))} placeholder="Ej: Biología Celular" />
            </div>
            <div className="form-group">
              <label>Materia (opcional)</label>
              <input value={nuevoSet.materia} onChange={e => setNuevoSet(p => ({ ...p, materia: e.target.value }))} placeholder="Ej: Biología" />
            </div>
            <div className="form-group">
              <label>Color</label>
              <div style={{ display:'flex', gap:8 }}>
                {colores.map(c => <button key={c} onClick={() => setNuevoSet(p => ({ ...p, color: c }))} style={{ width:28, height:28, borderRadius:'50%', background:c, border: nuevoSet.color === c ? '3px solid #1e293b':'3px solid transparent', cursor:'pointer' }} />)}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearSet} disabled={!nuevoSet.titulo}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {showCardModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Nueva tarjeta</div>
              <button className="modal-close" onClick={() => setShowCardModal(false)}>✕</button>
            </div>
            <div className="form-group">
              <label>Pregunta</label>
              <textarea value={nuevaCard.pregunta} onChange={e => setNuevaCard(p => ({ ...p, pregunta: e.target.value }))} placeholder="¿Cuál es...?" style={{ minHeight:80 }} />
            </div>
            <div className="form-group">
              <label>Respuesta</label>
              <textarea value={nuevaCard.respuesta} onChange={e => setNuevaCard(p => ({ ...p, respuesta: e.target.value }))} placeholder="La respuesta es..." style={{ minHeight:80 }} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCardModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearCard} disabled={!nuevaCard.pregunta || !nuevaCard.respuesta}>Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
