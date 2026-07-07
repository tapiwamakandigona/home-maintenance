import { useState } from 'react'
import { Link } from 'react-router-dom'
import { databases, ID, DATABASE_ID, COLLECTIONS, userDocPermissions } from '../lib/appwrite'
import { useApp } from '../context/AppContext'
import { MailCheck, MessageSquare } from 'lucide-react'

export default function Complaints() {
  const { user, authChecked } = useApp()
  const [form, setForm] = useState({ name: '', bookingCode: '', message: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      // The complaints collection only allows creates from logged-in users
      // (role "users"); the form below is gated on `user`.
      const perms = userDocPermissions(user.$id)
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.complaints,
        ID.unique(),
        {
          customerId: user.$id,
          name: form.name || user?.name || user?.email || 'Anonymous',
          bookingCode: form.bookingCode || null,
          message: form.message,
          status: 'open',
        },
        perms
      )
      setDone(true)
    } catch (err) {
      setError(err?.message || 'Could not submit your complaint. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="center-page">
        <div className="card confirm-card">
          <div className="confirm-icon">
            <MailCheck className="icon" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <h2>Complaint Received</h2>
          <p>Thank you — our team will review it and get back to you.</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!authChecked) {
    return <div className="state-msg">Loading…</div>
  }

  if (!user) {
    return (
      <div className="center-page">
        <div className="card form-card">
          <h2 className="card-title">Submit a Complaint</h2>
          <p className="state-msg">
            Please <Link to="/login" state={{ from: '/complaints' }}>login</Link> or{' '}
            <Link to="/signup" state={{ from: '/complaints' }}>sign up</Link> to submit a complaint.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="center-page">
      <div className="card form-card">
        <h2 className="card-title">
          <MessageSquare className="icon" aria-hidden="true" /> Submit a Complaint
        </h2>
        <form onSubmit={submit} className="form">
          <div className="field">
            <label>Your Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="field">
            <label>Booking Code (optional)</label>
            <input value={form.bookingCode} onChange={(e) => set('bookingCode', e.target.value)} placeholder="HM-XXXXXX" />
          </div>
          <div className="field">
            <label>Message</label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              placeholder="Tell us what went wrong"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </div>
  )
}
