import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { databases, Query, DATABASE_ID, COLLECTIONS } from '../lib/appwrite'
import Stars from '../components/Stars'
import CategoryIcon from '../components/CategoryIcon'
import { Search, MapPin, ShieldCheck } from 'lucide-react'

export default function Browse() {
  const [categories, setCategories] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [catRes, workerRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.categories, [
            Query.equal('active', true),
            Query.limit(50),
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.workers, [
            Query.equal('status', 'approved'),
            Query.limit(100),
          ]),
        ])
        if (!cancelled) {
          setCategories(catRes.documents)
          setWorkers(workerRes.documents)
        }
      } catch (e) {
        if (!cancelled) setError('Could not load workers right now. Please check your connection and try again.')
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const catBySlug = useMemo(() => Object.fromEntries(categories.map((c) => [c.slug, c])), [categories])
  const areas = useMemo(() => [...new Set(workers.map((w) => w.area).filter(Boolean))].sort(), [workers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return workers.filter((w) => {
      if (catFilter !== 'all' && w.category !== catFilter) return false
      if (areaFilter !== 'all' && w.area !== areaFilter) return false
      if (q) {
        const cat = catBySlug[w.category]
        const hay = [w.name, w.area, w.bio, w.category, cat?.name].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [workers, catFilter, areaFilter, search, catBySlug])

  const availableNow = workers.filter((w) => w.available).length

  function priceFor(w) {
    if (w.priceUSD != null) return w.priceUSD
    return catBySlug[w.category]?.priceUSD ?? null
  }

  return (
    <div className="browse">
      <section className="hero">
        <div className="hero-eyebrow">
          <ShieldCheck className="icon" aria-hidden="true" /> Vetted workers · Zimbabwe
        </div>
        <h1>Find Trusted Home Service Workers</h1>
        <p>Connect with skilled local professionals in Zimbabwe — right to your door.</p>
        <div className="hero-search-wrap">
          <Search className="icon" aria-hidden="true" />
          <input
            className="hero-search"
            type="search"
            placeholder="Search by name, service or area…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section className="stats-strip">
        <div className="stat-card">
          <div className="stat-number">{workers.length}</div>
          <div className="stat-label">Workers</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{availableNow}</div>
          <div className="stat-label">Available Now</div>
        </div>
      </section>

      <section className="filters">
        <h2 className="section-title">Browse by Category</h2>
        <div className="chip-row">
          <button className={'chip' + (catFilter === 'all' ? ' active' : '')} onClick={() => setCatFilter('all')}>
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.$id}
              className={'chip' + (catFilter === c.slug ? ' active' : '')}
              onClick={() => setCatFilter(catFilter === c.slug ? 'all' : c.slug)}
            >
              <CategoryIcon category={c} /> {c.name}
            </button>
          ))}
        </div>
        <div className="area-filter">
          <label htmlFor="area-select">Area:</label>
          <select id="area-select" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
            <option value="all">All Areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="worker-grid-wrap">
        {loading ? (
          <div className="state-msg">Loading workers…</div>
        ) : error ? (
          <div className="state-msg error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="state-msg">No workers match your filters yet. Try a different category or area.</div>
        ) : (
          <div className="worker-grid">
            {filtered.map((w) => {
              const cat = catBySlug[w.category]
              const price = priceFor(w)
              return (
                <article key={w.$id} className="worker-card">
                  <div className="worker-top">
                    <div className="worker-avatar-wrap">
                      {w.photoUrl ? (
                        <img className="worker-avatar-img" src={w.photoUrl} alt={w.name} />
                      ) : (
                        <div className="worker-avatar">{(w.name || '?')[0].toUpperCase()}</div>
                      )}
                      <span className={'worker-avatar-dot ' + (w.available ? 'on' : 'off')} aria-hidden="true" />
                    </div>
                    <span className="worker-cat-chip">
                      <CategoryIcon category={cat} /> {cat?.name || w.category}
                    </span>
                  </div>
                  <h3 className="worker-name">{w.name}</h3>
                  <div className="worker-area">
                    <MapPin className="icon" aria-hidden="true" /> {w.area}
                  </div>
                  <Stars value={w.rating || 0} count={w.ratingCount || 0} />
                  <div className="worker-meta">
                    <span className="worker-price">{price != null ? `$${Number(price).toFixed(2)}` : '—'}</span>
                    <span className={'avail-dot ' + (w.available ? 'on' : 'off')}>
                      {w.available ? 'Available' : 'On a job'}
                    </span>
                  </div>
                  {w.bio && <p className="worker-bio">{w.bio}</p>}
                  <button className="btn btn-primary worker-hire" onClick={() => navigate('/hire/' + w.$id)}>
                    Hire
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
