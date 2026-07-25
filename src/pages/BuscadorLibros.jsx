import { useState } from 'react'

export default function BuscadorLibros({ user }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('todos')

  async function buscar(e) {
    e && e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    setSelected(null)
    setResults([])

    try {
      // Search Google Books
      const gbResp = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&printType=books`)
      const gbData = await gbResp.json()
      const gbBooks = (gbData.items || []).map(b => ({
        id: 'gb_' + b.id,
        source: 'google',
        title: b.volumeInfo.title,
        authors: b.volumeInfo.authors || [],
        year: b.volumeInfo.publishedDate?.slice(0, 4),
        publisher: b.volumeInfo.publisher,
        pages: b.volumeInfo.pageCount,
        description: b.volumeInfo.description,
        cover: b.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
        categories: b.volumeInfo.categories,
        previewLink: b.volumeInfo.previewLink,
        buyLink: b.saleInfo?.buyLink,
        downloadable: false,
        pdfUrl: null,
      }))

      // Search Open Library (free downloadable books)
      const olResp = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15&has_fulltext=true`)
      const olData = await olResp.json()
      const olBooks = (olData.docs || []).filter(b => b.ia && b.ia.length > 0).slice(0, 10).map(b => ({
        id: 'ol_' + (b.key || b.ia[0]),
        source: 'openlibrary',
        title: b.title,
        authors: b.author_name || [],
        year: b.first_publish_year?.toString(),
        publisher: b.publisher?.[0],
        pages: b.number_of_pages_median,
        description: null,
        cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null,
        categories: b.subject?.slice(0, 3),
        previewLink: `https://openlibrary.org${b.key}`,
        buyLink: null,
        downloadable: true,
        pdfUrl: `https://archive.org/download/${b.ia[0]}/${b.ia[0]}.pdf`,
        iaId: b.ia[0],
      }))

      setResults([...olBooks, ...gbBooks])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const filtered = tab === 'todos' ? results : tab === 'gratis' ? results.filter(r => r.downloadable) : results.filter(r => !r.downloadable)

  const BookCard = ({ book }) => (
    <div onClick={() => setSelected(book)}
      style={{
        display: 'flex', gap: 12, padding: '14px 8px',
        borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
        borderRadius: 8, transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ flexShrink: 0 }}>
        {book.cover
          ? <img src={book.cover} alt={book.title} style={{ width: 52, height: 74, objectFit: 'cover', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
          : <div style={{ width: 52, height: 74, background: '#ede9fe', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📖</div>
        }
        {book.downloadable && (
          <div style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.65rem', fontWeight: 700, textAlign: 'center', marginTop: 4, borderRadius: 4, padding: '2px 4px' }}>GRATIS</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
        {book.authors.length > 0 && <div style={{ color: '#6366f1', fontSize: '0.8rem', marginBottom: 3 }}>{book.authors.slice(0, 2).join(', ')}</div>}
        <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 3 }}>
          {[book.year, book.publisher, book.pages && `${book.pages} pag.`].filter(Boolean).join(' · ')}
        </div>
        {book.description && <div style={{ color: '#64748b', fontSize: '0.75rem', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{book.description}</div>}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Buscador de Libros</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Busca por titulo o autor. Los marcados como GRATIS se pueden descargar en PDF.</p>

      <form onSubmit={buscar} style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Titulo, autor..."
          style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
        />
        <button type="submit" disabled={loading} style={{
          padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontSize: '1rem'
        }}>
          {loading ? '...' : 'Buscar'}
        </button>
      </form>

      {results.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
          {[['todos','Todos'], ['gratis','Gratis (PDF)'], ['otros','Solo info']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              background: tab === k ? '#6366f1' : '#f1f5f9', color: tab === k ? 'white' : '#64748b'
            }}>{l}</button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={() => setSelected(null)}>
          <div style={{ background:'white', borderRadius:20, padding:'1.5rem', maxWidth:480, width:'100%', maxHeight:'85vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} style={{ float:'right', background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#94a3b8' }}>x</button>
            <div style={{ display:'flex', gap:16, marginBottom:16 }}>
              {selected.cover
                ? <img src={selected.cover} alt={selected.title} style={{ width:80, height:115, objectFit:'cover', borderRadius:6, boxShadow:'0 4px 12px rgba(0,0,0,0.2)', flexShrink:0 }} />
                : <div style={{ width:80, height:115, background:'#ede9fe', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, flexShrink:0 }}>📖</div>
              }
              <div>
                <div style={{ fontWeight:700, fontSize:'1.1rem', color:'#1e293b', marginBottom:4 }}>{selected.title}</div>
                {selected.authors.length > 0 && <div style={{ color:'#6366f1', fontSize:'0.88rem', marginBottom:4 }}>{selected.authors.join(', ')}</div>}
                <div style={{ color:'#94a3b8', fontSize:'0.8rem' }}>
                  {[selected.year, selected.publisher, selected.pages && `${selected.pages} pag.`].filter(Boolean).join(' · ')}
                </div>
                {selected.downloadable && (
                  <div style={{ marginTop:8, background:'#dcfce7', color:'#16a34a', display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:'0.75rem', fontWeight:700 }}>
                    DISPONIBLE GRATIS EN PDF
                  </div>
                )}
              </div>
            </div>
            {selected.categories && selected.categories.length > 0 && (
              <div style={{ marginBottom:10 }}>
                {selected.categories.slice(0,4).map(c => <span key={c} style={{ background:'#ede9fe', color:'#6366f1', borderRadius:20, padding:'3px 10px', fontSize:'0.72rem', marginRight:6, display:'inline-block', marginBottom:4 }}>{c}</span>)}
              </div>
            )}
            {selected.description && <p style={{ color:'#475569', fontSize:'0.88rem', lineHeight:1.6, marginBottom:16 }}>{selected.description}</p>}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {selected.downloadable && selected.pdfUrl && (
                <a href={selected.pdfUrl} target="_blank" rel="noreferrer" style={{ flex:1, minWidth:120, padding:'10px', background:'linear-gradient(135deg,#16a34a,#22c55e)', color:'white', borderRadius:10, textAlign:'center', textDecoration:'none', fontWeight:600, fontSize:'0.9rem' }}>
                  Descargar PDF
                </a>
              )}
              {selected.previewLink && (
                <a href={selected.previewLink} target="_blank" rel="noreferrer" style={{ flex:1, minWidth:120, padding:'10px', background:'#ede9fe', color:'#6366f1', borderRadius:10, textAlign:'center', textDecoration:'none', fontWeight:600, fontSize:'0.9rem' }}>
                  Ver libro
                </a>
              )}
              {selected.buyLink && (
                <a href={selected.buyLink} target="_blank" rel="noreferrer" style={{ flex:1, minWidth:120, padding:'10px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', borderRadius:10, textAlign:'center', textDecoration:'none', fontWeight:600, fontSize:'0.9rem' }}>
                  Comprar
                </a>
              )}
              <button onClick={() => {
                const txt = `${selected.title}\nAutor: ${selected.authors.join(', ')}\nAno: ${selected.year || '-'}\n${selected.previewLink || ''}`
                if (navigator.share) navigator.share({ title: selected.title, text: txt })
                else { navigator.clipboard.writeText(txt); alert('Copiado al portapapeles') }
              }} style={{ flex:1, minWidth:120, padding:'10px', background:'#f1f5f9', color:'#475569', borderRadius:10, textAlign:'center', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.9rem' }}>
                Compartir
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign:'center', color:'#94a3b8', padding:'3rem' }}>Buscando en Google Books y Open Library...</div>}
      {!loading && searched && filtered.length === 0 && <div style={{ textAlign:'center', color:'#94a3b8', padding:'3rem' }}>No se encontraron resultados.</div>}
      {!loading && filtered.length > 0 && (
        <div style={{ background:'white', borderRadius:16, padding:'0 0.5rem', border:'1px solid #e2e8f0' }}>
          <div style={{ padding:'0.75rem 0.5rem', color:'#94a3b8', fontSize:'0.85rem' }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} — {results.filter(r => r.downloadable).length} disponibles en PDF gratis
          </div>
          {filtered.map(b => <BookCard key={b.id} book={b} />)}
        </div>
      )}
    </div>
  )
}
