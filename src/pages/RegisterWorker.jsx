import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { databases, ID, Query, DATABASE_ID, COLLECTIONS } from '../lib/appwrite'
import { useApp } from '../context/AppContext'

const AREAS = [
  'Harare - Avondale',
  'Harare - Budiriro',
  'Harare - Glen View',
  'Harare - Highfield',
  'Harare - Kuwadzana',
  'Harare - Mbare',
  'Chitungwiza',
  'Norton',
  'Ruwa',
  'Epworth',
  'Other',
]

export default function RegisterWorker() {
  const { user, refreshWorker } = useApp()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '',
    phone: '',
    idNumber: '',
    address: '',
    category: '',
    area: '',
    bio: '',
    photoUrl: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    databases
      .listDocuments(DATABASE_ID, COLLECTIONS.categories, [Query.equal('active', true), Query.limit(50)])
      .then((res) => setCategories(res.documents))
      .catch(() => setError('Could not load service categories. Please refresh.'))
  }, [])

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.category || !form.area) {
      setError('Please select a service category and area.')
      return
    }
    setBusy(true)
    try {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.workers, ID.unique(), {
        name: form.name,
        phone: form.phone,
        idNumber: form.idNumber,
        address: form.address,
        category: form.category,
        area: form.area,
        bio: form.bio,
        photoUrl: form.photoUrl || null,
        status: 'pending',
        available: true,
        rating: 0,
        ratingCount: 0,
        jobsDone: 0,
        userId: user ? user.$id : null,
      })
      if (user) await refreshWorker()
      setDone(true)
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="center-page">
        <div className="card confirm-card">
          <div className="confirm-icon">✅</div>
          <h2>Registration Submitted!</h2>
          <p>
            Thank you, <strong>{form.name}</strong>. Your profile has been received.
          </p>
          <p className="notice notice-warn">⚠️ Your profile will be reviewed by admin before going live.</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="center-page">
      <div className="card form-card">
        <h2 className="card-title">Register as a Worker</h2>
        <div className="notice notice-warn">⚠️ Your profile will be reviewed by admin before going live.</div>
        <form onSubmit={submit} className="form">
          <div className="field">
            <label>Full Name</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your full name" />
          </div>
          <div className="field">
            <label>Phone Number</label>
            <input required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+263 7x xxx xxxx" />
          </div>
          <div className="field">
            <label>National ID Number</label>
            <input required value={form.idNumber} onChange={(e) => set('idNumber', e.target.value)} placeholder="e.g. 63-123456A70" />
          </div>
          <div className="field">
            <label>Home Address</label>
            <input required value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Your home address" />
          </div>
          <div className="field">
            <label>Service Category</label>
            <select required value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Area / Location</label>
            <select required value={form.area} onChange={(e) => set('area', e.target.value)}>
              <option value="">Select area</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Short Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              placeholder="Tell customers about your experience"
              rows={3}
            />
          </div>
          <div className="field">
            <label>Photo URL (optional)</label>
            <input value={form.photoUrl} onChange={(e) => set('photoUrl', e.target.value)} placeholder="https://…" />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit Registration'}
          </button>
        </form>
      </div>
    </div>
  )
}
