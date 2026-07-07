import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  databases,
  ID,
  Query,
  DATABASE_ID,
  COLLECTIONS,
  bookingCode,
  userDocPermissions,
} from '../lib/appwrite'
import { PAYMENT_METHODS, simulatePayment } from '../lib/paynow'
import { PLATFORM_FEE_RATE } from '../lib/config'
import { useApp } from '../context/AppContext'

export default function Hire() {
  const { workerId } = useParams()
  const navigate = useNavigate()
  const { user, authChecked } = useApp()

  const [worker, setWorker] = useState(null)
  const [category, setCategory] = useState(null)
  const [loadErr, setLoadErr] = useState('')
  const [step, setStep] = useState('form') // form | pay | success
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState(null)

  const [form, setForm] = useState({
    address: '',
    gps: '',
    description: '',
    scheduledTime: '',
    phone: '',
  })
  const [gpsBusy, setGpsBusy] = useState(false)
  const [pay, setPay] = useState({ method: 'ecocash', mobileNumber: '', email: '' })

  useEffect(() => {
    if (authChecked && !user) {
      navigate('/login', { state: { from: '/hire/' + workerId } })
    }
  }, [authChecked, user, navigate, workerId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const w = await databases.getDocument(DATABASE_ID, COLLECTIONS.workers, workerId)
        if (cancelled) return
        setWorker(w)
        try {
          const c = await databases.getDocument(DATABASE_ID, COLLECTIONS.categories, w.category)
          if (!cancelled) setCategory(c)
        } catch {
          // Retry via list query — a transient failure here would otherwise
          // silently price the job at $0 (guarded again in toPayment).
          try {
            const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.categories, [
              Query.equal('slug', w.category),
              Query.limit(1),
            ])
            if (!cancelled && res.documents[0]) setCategory(res.documents[0])
          } catch {
            // toPayment blocks $0 checkouts
          }
        }
      } catch {
        if (!cancelled) setLoadErr('Could not load this worker. They may no longer be available.')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [workerId])

  const amount = worker ? Number(worker.priceUSD ?? category?.priceUSD ?? 0) : 0

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device.')
      return
    }
    setGpsBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('gps', pos.coords.latitude.toFixed(6) + ',' + pos.coords.longitude.toFixed(6))
        setGpsBusy(false)
      },
      () => {
        setError('Could not get your location. You can leave GPS blank.')
        setGpsBusy(false)
      },
      { timeout: 10000 }
    )
  }

  function toPayment(e) {
    e.preventDefault()
    setError('')
    if (!(amount > 0)) {
      setError('Could not load the price for this service. Please check your connection and reload the page.')
      return
    }
    setPay((p) => ({ ...p, mobileNumber: p.mobileNumber || form.phone, email: p.email || user?.email || '' }))
    setStep('pay')
  }

  async function doPay(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await simulatePayment({
        amount,
        method: pay.method,
        mobileNumber: pay.mobileNumber,
        email: pay.email,
      })
      if (!result.success) {
        setError('Payment failed. Please try again.')
        setBusy(false)
        return
      }
      const code = bookingCode()
      const fee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100
      // Worker + admin access comes from collection-level permissions; a
      // customer session may only grant roles it holds (see lib/appwrite.js).
      const perms = userDocPermissions(user.$id)
      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.bookings,
        ID.unique(),
        {
          code,
          workerId: worker.$id,
          workerName: worker.name,
          workerPhone: worker.phone,
          category: worker.category,
          customerId: user.$id,
          customerName: user.name || user.email,
          customerPhone: form.phone,
          address: form.address,
          gps: form.gps || null,
          description: form.description,
          scheduledTime: form.scheduledTime ? new Date(form.scheduledTime).toISOString() : null,
          amount,
          fee,
          status: 'paid_escrow',
          paymentMethod: pay.method,
        },
        perms
      )
      // mark worker busy (may fail if permissions restrict; booking still stands)
      try {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.workers, worker.$id, { available: false })
      } catch (err) {
        console.warn('Could not update worker availability', err)
      }
      // notify worker
      if (worker.userId) {
        try {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.notifications,
            ID.unique(),
            {
              userId: worker.userId,
              title: 'New job ' + code,
              body: `${user.name || user.email} hired you for ${category?.name || worker.category} at ${form.address}.`,
              type: 'booking',
              read: false,
            },
            // No doc-level perms: the customer cannot grant Role.user(worker.userId);
            // the worker reads/updates it via collection-level permissions.
            []
          )
        } catch (err) {
          console.warn('Could not create worker notification', err)
        }
      }
      setBooking(doc)
      setStep('success')
    } catch (err) {
      setError(err?.message || 'Something went wrong processing your booking.')
    } finally {
      setBusy(false)
    }
  }

  if (loadErr) {
    return (
      <div className="center-page">
        <div className="card">
          <p className="state-msg error">{loadErr}</p>
          <Link to="/" className="btn btn-primary">
            Back to Browse
          </Link>
        </div>
      </div>
    )
  }

  if (!worker) {
    return <div className="state-msg">Loading…</div>
  }

  if (step === 'success' && booking) {
    return (
      <div className="center-page">
        <div className="card confirm-card">
          <div className="confirm-icon">🎉</div>
          <h2>Booking Confirmed!</h2>
          <p>
            Your reference code is <strong className="ref-code">{booking.code}</strong>
          </p>
          <p>
            You hired <strong>{worker.name}</strong> for <strong>${amount.toFixed(2)}</strong>.
          </p>
          <p className="notice notice-info">🔒 Funds held in escrow until you confirm the job is done.</p>
          <p className="notice notice-info">
            📩 {worker.name} also receives an SMS backup with the job details (SMS gateway pending).
          </p>
          <div className="btn-row">
            <Link to="/bookings" className="btn btn-primary">
              View My Bookings
            </Link>
            <Link to="/" className="btn btn-outline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'pay') {
    return (
      <div className="center-page">
        <div className="card form-card paynow-card">
          <h2 className="card-title">💳 Pay via PayNow Zimbabwe</h2>
          <div className="pay-summary">
            <div className="pay-flag">🇿🇼</div>
            <div>
              Hiring: <strong className="accent">{worker.name}</strong>
            </div>
            <div>
              Amount due: <strong className="accent">${amount.toFixed(2)}</strong>
            </div>
          </div>
          <form onSubmit={doPay} className="form">
            <div className="field">
              <label>Select Payment Method</label>
              <div className="method-grid">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    className={'method-btn' + (pay.method === m.id ? ' active' : '')}
                    onClick={() => setPay((p) => ({ ...p, method: m.id }))}
                  >
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Mobile Number</label>
              <input
                required
                value={pay.mobileNumber}
                onChange={(e) => setPay((p) => ({ ...p, mobileNumber: e.target.value }))}
                placeholder="07xx xxx xxx"
              />
              <small className="field-hint">You will receive a payment prompt on your phone.</small>
            </div>
            <div className="field">
              <label>Email (for receipt)</label>
              <input
                type="email"
                required
                value={pay.email}
                onChange={(e) => setPay((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Processing…' : `Pay $${amount.toFixed(2)}`}
            </button>
            <button type="button" className="btn btn-outline btn-block" onClick={() => setStep('form')} disabled={busy}>
              Back
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="center-page">
      <div className="card form-card">
        <h2 className="card-title">Hire {worker.name}</h2>
        <p className="hire-sub">
          {category?.icon} {category?.name || worker.category} · 📍 {worker.area} ·{' '}
          <strong>${amount.toFixed(2)}</strong>
        </p>
        <form onSubmit={toPayment} className="form">
          <div className="field">
            <label>Job Address *</label>
            <input required value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Where should the worker come?" />
          </div>
          <div className="field">
            <label>GPS Location (optional)</label>
            <div className="gps-row">
              <input value={form.gps} onChange={(e) => set('gps', e.target.value)} placeholder="lat,lng" />
              <button type="button" className="btn btn-outline" onClick={useMyLocation} disabled={gpsBusy}>
                {gpsBusy ? 'Locating…' : '📍 Use my location'}
              </button>
            </div>
          </div>
          <div className="field">
            <label>Job Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="Describe what you need done"
            />
          </div>
          <div className="field">
            <label>Scheduled Time</label>
            <input
              type="datetime-local"
              value={form.scheduledTime}
              onChange={(e) => set('scheduledTime', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Your Phone Number</label>
            <input required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+263 7x xxx xxxx" />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary btn-block">Continue to Payment</button>
        </form>
      </div>
    </div>
  )
}
