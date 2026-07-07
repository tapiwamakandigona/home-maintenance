import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { databases, ID, Query, DATABASE_ID, COLLECTIONS, userDocPermissions } from '../lib/appwrite'
import Stars from '../components/Stars'
import { useApp } from '../context/AppContext'

const STATUS_LABELS = {
  paid_escrow: 'Paid (Escrow)',
  in_progress: 'In Progress',
  completed: 'Completed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
}

export default function MyBookings() {
  const { user, authChecked } = useApp()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [rateFor, setRateFor] = useState(null) // booking being rated
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (authChecked && !user) navigate('/login', { state: { from: '/bookings' } })
  }, [authChecked, user, navigate])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.bookings, [
        Query.equal('customerId', user.$id),
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ])
      setBookings(res.documents)
    } catch (e) {
      console.error(e)
      setError('Could not load your bookings. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  async function confirmDone(b) {
    setBusy(true)
    setMsg('')
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.bookings, b.$id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
      try {
        const w = await databases.getDocument(DATABASE_ID, COLLECTIONS.workers, b.workerId)
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.workers, b.workerId, {
          available: true,
          jobsDone: (w.jobsDone || 0) + 1,
        })
      } catch (err) {
        console.warn('Could not update worker record', err)
      }
      setRateFor({ ...b, status: 'completed' })
      setStars(5)
      setComment('')
      await load()
    } catch (e) {
      setMsg(e?.message || 'Could not confirm the job. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function submitRating() {
    if (!rateFor) return
    setBusy(true)
    try {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.reviews, ID.unique(), {
        workerId: rateFor.workerId,
        bookingId: rateFor.$id,
        customerId: user.$id,
        customerName: user.name || user.email,
        stars,
        comment,
      })
      // Recompute worker rating incrementally
      try {
        const w = await databases.getDocument(DATABASE_ID, COLLECTIONS.workers, rateFor.workerId)
        const count = (w.ratingCount || 0) + 1
        const rating = Math.round((((w.rating || 0) * (w.ratingCount || 0) + stars) / count) * 10) / 10
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.workers, rateFor.workerId, {
          rating,
          ratingCount: count,
        })
      } catch (err) {
        console.warn('Could not update worker rating', err)
      }
      setMsg('Thanks for your rating!')
      setRateFor(null)
    } catch (e) {
      setMsg(e?.message || 'Could not submit rating.')
    } finally {
      setBusy(false)
    }
  }

  async function requestRefund(b) {
    setBusy(true)
    setMsg('')
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.complaints,
        ID.unique(),
        {
          customerId: user.$id,
          name: user.name || user.email,
          bookingCode: b.code,
          message: `Refund requested for booking ${b.code} (${b.workerName}, $${b.amount}). No job was done within a day of payment.`,
          status: 'open',
        },
        userDocPermissions(user.$id)
      )
      setMsg('Refund request submitted — an admin will process it. If no job is done within a day of payment, your money is returned.')
    } catch (e) {
      setMsg(e?.message || 'Could not submit refund request.')
    } finally {
      setBusy(false)
    }
  }

  function canRefund(b) {
    if (b.status !== 'paid_escrow') return false
    return Date.now() - new Date(b.$createdAt).getTime() > 24 * 60 * 60 * 1000
  }

  if (!user) return null

  return (
    <div className="page">
      <h2 className="page-title">My Bookings</h2>
      <p className="escrow-rule notice notice-info">
        🔒 Escrow rule: If no job is done within a day of payment, your money is returned.
      </p>
      {msg && <div className="notice notice-info">{msg}</div>}
      {loading ? (
        <div className="state-msg">Loading your bookings…</div>
      ) : error ? (
        <div className="state-msg error">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="state-msg">
          You have no bookings yet. <Link to="/">Browse workers</Link> to hire someone.
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((b) => (
            <div key={b.$id} className="card booking-card">
              <div className="booking-head">
                <strong className="ref-code">{b.code}</strong>
                <span className={'badge badge-' + b.status}>{STATUS_LABELS[b.status] || b.status}</span>
              </div>
              <div className="booking-body">
                <div>
                  👷 <strong>{b.workerName}</strong> ({b.workerPhone})
                </div>
                <div>💵 ${Number(b.amount).toFixed(2)}</div>
                {b.scheduledTime && <div>🗓 {new Date(b.scheduledTime).toLocaleString()}</div>}
                <div>📍 {b.address}</div>
              </div>
              <div className="btn-row">
                {(b.status === 'paid_escrow' || b.status === 'in_progress') && (
                  <button className="btn btn-primary" disabled={busy} onClick={() => confirmDone(b)}>
                    Confirm job done
                  </button>
                )}
                {canRefund(b) && (
                  <button className="btn btn-outline" disabled={busy} onClick={() => requestRefund(b)}>
                    Request refund
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {rateFor && (
        <div className="modal-backdrop" onClick={() => setRateFor(null)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h3>Rate {rateFor.workerName}</h3>
            <p>How was the job?</p>
            <Stars value={stars} onChange={setStars} size="big" />
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment (optional)"
            />
            <div className="btn-row">
              <button className="btn btn-primary" disabled={busy} onClick={submitRating}>
                Submit Rating
              </button>
              <button className="btn btn-outline" onClick={() => setRateFor(null)}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
