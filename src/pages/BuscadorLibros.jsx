import { useState } from 'react'

export default function BuscadorLibros({ user }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState(null)

  async function buscar(e) {
    e && e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    setSelected(null)
    try {
      const resp = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&langRestrict=es&printType=books`)
      const data = await resp.json()
      setResults(data.items || [])
    } catch (e) {
      setResults([])
    }
    setLoading(false)
  }

  const card = (book) => {
    const info = book.volumeInfo
    const thumb = info.imageLinks?.thumbnail?.replace('http:', 'https:') || null
    return (
      <div key={book.id} onClick={() => setSelected(book)}
        style={{
          display: 'flex', gap: 12, padding: '14px 0',
          borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
          transition: 'background 0.15s', borderRadius: 8,
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ flexShrink: 0 }}>
          {thumb
            ? <img src={thumb} alt={info.title} style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
            : <div style={{ width: 56, height: 80, background: '#ede9fe', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📖</div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{info.title}</div>
          {info.authors && <div style={{ color: '#6366f1', fontSize: '0.82rem', marginBottom: 4 }}>{info.authors.join(', ')}</div>}
          <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 4 }}>
            {info.publishedDate?.slice(0, 4)}{info.publisher ? ` · ${info.publisher}` : ''}{info.pageCount ? ` · ${info.pageCount} pág.` : ''}
          </div>
          {info.description && <div style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{info.description}</div>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>📚 Buscador de Libros</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Buscá cualquier libro — obtenés portada, descripción, autores y link de compra.</p>

      <form onSubmit={buscar} style={{ display: 'flex', gap: 10, marginBottom: '1.5rem' }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Título, autor, ISBN..."
          style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
        />
        <button type="submit" disabled={loading} style={{
          padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontSize: '1rem'
        }}>
          {loading ? '...' : 'Buscar'}
        </button>
      </form>

      {/* Detail modal */}
      {selected && (() => {
        const info = selected.volumeInfo
        const thumb = info.imageLinks?.thumbnail?.replace('http:', 'https:') || null
        const previewLink = info.previewLink
        const buyLink = selected.saleInfo?.buyLink
        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }} onClick={() => setSelected(null)}>
            <div style={{
              background: 'white', borderRadius: 20, padding: '1.5rem', maxWidth: 480, width: '100%',
              maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelected(null)} style={{
                float: 'right', background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#94a3b8'
              }}>×</button>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                {thumb
                  ? <img src={thumb} alt={info.title} style={{ width: 80, height: 115, objectFit: 'cover', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', flexShrink: 0 }} />
                  : <div style={{ width: 80, height: 115, background: '#ede9fe', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>📖</div>
                }
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b', marginBottom: 4 }}>{info.title}</div>
                  {info.subtitle && <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 4 }}>{info.subtitle}</div>}
                  {info.authors && <div style={{ color: '#6366f1', fontSize: '0.88rem', marginBottom: 4 }}>{info.authors.join(', ')}</div>}
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    {[info.publishedDate?.slice(0,4), info.publisher, info.pageCount && `${info.pageCount} páginas`].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
              {info.categories && <div style={{ marginBottom: 10 }}>
                {info.categories.map(c => <span key={c} style={{ background: '#ede9fe', color: '#6366f1', borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', marginRight: 6 }}>{c}</span>)}
              </div>}
              {info.description && <p style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 16 }}>{info.description}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                {previewLink && <a href={previewLink} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '10px', background: '#ede9fe', color: '#6366f1', borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Vista previa</a>}
                {buyLink && <a href={buyLink} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', borderRadius: 10, textAlign: 'center', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Comprar</a>}
              </div>
            </div>
          </div>
        )
      })()}

      {loading && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>Buscando...</div>}
      {!loading && searched && results.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>No se encontraron resultados.</div>}
      {!loading && results.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: '0 1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '0.75rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>{results.length} resultados para "{query}"</div>
          {results.map(card)}
        </div>
      )}
    </div>
  )
}
