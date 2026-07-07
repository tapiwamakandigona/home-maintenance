import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { databases, Query, DATABASE_ID, COLLECTIONS } from '../lib/appwrite'
import { useApp } from '../context/AppContext'

const STATUS_LABELS = {
  pending: '⏳ Pending admin review',
  approved: '✅ Approved — live on the platform',
  suspended: '🚫 Suspended',
}

export default function WorkerDashboard() {
  const { user, myWorker, notifications, refreshWorker, authChecked } = useApp()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!myWorker) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.bookings, [
        Query.equal('workerId', myWorker.$id),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ])
      setJobs(res.documents)
    } catch (e) {
      console.error(e)
      setError('Could not load your jobs right now.')
    } finally {
      setLoading(false)
    }
  }, [myWorker])

  useEffect(() => {
    load()
  }, [load])

  async function toggleAvailable() {
    if (!myWorker) return
    setBusy(true)
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.workers, myWorker.$id, {
        available: !myWorker.available,
      })
      await refreshWorker()
    } catch (e) {
      setError(e?.message || 'Could not update availability.')
    } finally {
      setBusy(false)
    }
  }

  if (!authChecked) return <div className="state-msg">Loading…</div>

  if (!user) {
    return (
      <div className="state-msg">
        Please <Link to="/login">login</Link> to see your worker dashboard.
      </div>
    )
  }

  if (!myWorker) {
    return (
      <div className="state-msg">
        You don&apos;t have a worker profile yet. <Link to="/register-worker">Register as Worker</Link> to get started.
      </div>
    )
  }

  return (
    <div className="page">
      <h2 className="page-title">Worker Dashboard</h2>
      <div className="card worker-profile-card">
        <h3>{myWorker.name}</h3>
        <p>{STATUS_LABELS[myWorker.status] || myWorker.status}</p>
        <p>
          ⭐ {myWorker.rating || 0} ({myWorker.ratingCount || 0} ratings) · {myWorker.jobsDone || 0} jobs done
        </p>
        <div className="btn-row">
          <button className="btn btn-primary" disabled={busy} onClick={toggleAvailable}>
            {myWorker.available ? 'Set as On a job' : 'Set as Available'}
          </button>
          <span className={'avail-dot ' + (myWorker.available ? 'on' : 'off')}>
            ● {myWorker.available ? 'Available' : 'On a job'}
          </span>
        </div>
      </div>

      <h3 className="section-title">My Jobs</h3>
      {error && <div className="state-msg error">{error}</div>}
      {loading ? (
        <div className="state-msg">Loading jobs…</div>
      ) : jobs.length === 0 ? (
        <div className="state-msg">No jobs yet — they will appear here when a customer hires you.</div>
      ) : (
        <div className="booking-list">
          {jobs.map((j) => (
            <div key={j.$id} className="card booking-card">
              <div className="booking-head">
                <strong className="ref-code">{j.code}</strong>
                <span className={'badge badge-' + j.status}>{j.status}</span>
              </div>
              <div className="booking-body">
                <div>
                  🧑 <strong>{j.customerName}</strong> ({j.customerPhone})
                </div>
                <div>📍 {j.address}</div>
                {j.description && <div>📝 {j.description}</div>}
                {j.scheduledTime && <div>🗓 {new Date(j.scheduledTime).toLocaleString()}</div>}
                <div>💵 ${Number(j.amount).toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="section-title">Notifications</h3>
      {notifications.length === 0 ? (
        <div className="state-msg">No notifications.</div>
      ) : (
        <div className="booking-list">
          {notifications.map((n) => (
            <div key={n.$id} className="card bell-item">
              <strong>{n.title}</strong>
              <span>{n.body}</span>
              <small>{new Date(n.$createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
