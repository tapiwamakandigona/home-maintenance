import { useState, useEffect, useCallback } from 'react'
import { databases, ID, Query, DATABASE_ID, COLLECTIONS } from '../lib/appwrite'
import { useApp } from '../context/AppContext'
import CategoryIcon from '../components/CategoryIcon'
import { Ban, MapPin, Plus, X } from 'lucide-react'

export default function Admin() {
  const { admin, authChecked } = useApp()
  const [workers, setWorkers] = useState([])
  const [bookings, setBookings] = useState([])
  const [complaints, setComplaints] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [priceEdits, setPriceEdits] = useState({})
  const [areas, setAreas] = useState([])
  const [newArea, setNewArea] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [w, b, c, cat, ar] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.workers, [Query.limit(200), Query.orderDesc('$createdAt')]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.bookings, [Query.limit(200), Query.orderDesc('$createdAt')]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.complaints, [Query.limit(200), Query.orderDesc('$createdAt')]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.categories, [Query.limit(50)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.areas, [Query.limit(100), Query.orderAsc('name')]),
      ])
      setWorkers(w.documents)
      setBookings(b.documents)
      setComplaints(c.documents)
      setCategories(cat.documents)
      setAreas(ar.documents)
    } catch (e) {
      console.error(e)
      setError('Could not load admin data. Make sure you are a member of the admins team.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (admin) load()
  }, [admin, load])

  async function act(fn) {
    setBusy(true)
    setError('')
    try {
      await fn()
      await load()
    } catch (e) {
      setError(e?.message || 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  const setWorkerStatus = (w, status) =>
    act(() => databases.updateDocument(DATABASE_ID, COLLECTIONS.workers, w.$id, { status }))

  const setBookingStatus = (b, status) =>
    act(async () => {
      const data = { status }
      if (status === 'completed') data.completedAt = new Date().toISOString()
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.bookings, b.$id, data)
      if (status === 'refunded' || status === 'completed') {
        try {
          await databases.updateDocument(DATABASE_ID, COLLECTIONS.workers, b.workerId, { available: true })
        } catch {
          // worker may be deleted
        }
      }
    })

  const resolveComplaint = (c) =>
    act(() => databases.updateDocument(DATABASE_ID, COLLECTIONS.complaints, c.$id, { status: 'resolved' }))

  const savePrice = (cat) =>
    act(() =>
      databases.updateDocument(DATABASE_ID, COLLECTIONS.categories, cat.$id, {
        priceUSD: Number(priceEdits[cat.$id]),
      })
    )

  const addArea = () => {
    const name = newArea.trim()
    if (!name) return
    if (areas.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      setError('That area already exists.')
      return
    }
    act(async () => {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.areas, ID.unique(), { name })
      setNewArea('')
    })
  }

  const removeArea = (a) => act(() => databases.deleteDocument(DATABASE_ID, COLLECTIONS.areas, a.$id))

  if (!authChecked) return <div className="state-msg">Loading…</div>
  if (!admin)
    return (
      <div className="state-msg error">
        <Ban className="icon" aria-hidden="true" /> Admin access only.
      </div>
    )

  const approvedWorkers = workers.filter((w) => w.status === 'approved')
  const pendingWorkers = workers.filter((w) => w.status === 'pending')
  const availableNow = approvedWorkers.filter((w) => w.available).length
  const customers = new Set(bookings.map((b) => b.customerId)).size
  const earnings = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (Number(b.fee) || 0), 0)

  return (
    <div className="page admin-page">
      <h2 className="page-title">Admin Panel</h2>
      {error && <div className="state-msg error">{error}</div>}
      {loading ? (
        <div className="state-msg">Loading admin data…</div>
      ) : (
        <>
          <section className="stats-strip admin-stats">
            <div className="stat-card">
              <div className="stat-number">{approvedWorkers.length}</div>
              <div className="stat-label">Workers</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{availableNow}</div>
              <div className="stat-label">Available Now</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{customers}</div>
              <div className="stat-label">Customers</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{bookings.length}</div>
              <div className="stat-label">Jobs Posted</div>
            </div>
            <div className="stat-card stat-wide">
              <div className="stat-number">${earnings.toFixed(2)}</div>
              <div className="stat-label">Platform Earnings</div>
            </div>
          </section>

          <section className="admin-section">
            <h3 className="section-title">Pending Worker Approvals ({pendingWorkers.length})</h3>
            {pendingWorkers.length === 0 ? (
              <div className="state-msg">No pending approvals.</div>
            ) : (
              pendingWorkers.map((w) => (
                <div key={w.$id} className="card admin-row">
                  <div>
                    <strong>{w.name}</strong> — {w.category} · {w.area} · {w.phone} · ID: {w.idNumber}
                    {w.bio && <div className="muted">{w.bio}</div>}
                  </div>
                  <div className="btn-row">
                    <button className="btn btn-primary" disabled={busy} onClick={() => setWorkerStatus(w, 'approved')}>
                      Approve
                    </button>
                    <button className="btn btn-danger" disabled={busy} onClick={() => setWorkerStatus(w, 'suspended')}>
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="admin-section">
            <h3 className="section-title">Manage Workers</h3>
            {workers
              .filter((w) => w.status !== 'pending')
              .map((w) => (
                <div key={w.$id} className="card admin-row">
                  <div>
                    <strong>{w.name}</strong> — {w.category} · {w.area} ·{' '}
                    <span className={'badge badge-' + w.status}>{w.status}</span>
                  </div>
                  <div className="btn-row">
                    {w.status === 'approved' ? (
                      <button className="btn btn-danger" disabled={busy} onClick={() => setWorkerStatus(w, 'suspended')}>
                        Suspend
                      </button>
                    ) : (
                      <button className="btn btn-primary" disabled={busy} onClick={() => setWorkerStatus(w, 'approved')}>
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </section>

          <section className="admin-section">
            <h3 className="section-title">Bookings & Payment History</h3>
            {bookings.length === 0 ? (
              <div className="state-msg">No bookings yet.</div>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Customer</th>
                      <th>Worker</th>
                      <th>Amount</th>
                      <th>Fee</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.$id}>
                        <td className="ref-code">{b.code}</td>
                        <td>{b.customerName}</td>
                        <td>{b.workerName}</td>
                        <td>${Number(b.amount).toFixed(2)}</td>
                        <td>${Number(b.fee).toFixed(2)}</td>
                        <td>{b.paymentMethod}</td>
                        <td>
                          <span className={'badge badge-' + b.status}>{b.status}</span>
                        </td>
                        <td>
                          <div className="btn-row">
                            {b.status === 'paid_escrow' && (
                              <button className="btn btn-small" disabled={busy} onClick={() => setBookingStatus(b, 'in_progress')}>
                                In progress
                              </button>
                            )}
                            {(b.status === 'paid_escrow' || b.status === 'in_progress') && (
                              <>
                                <button className="btn btn-small btn-primary" disabled={busy} onClick={() => setBookingStatus(b, 'completed')}>
                                  Complete
                                </button>
                                <button className="btn btn-small btn-danger" disabled={busy} onClick={() => setBookingStatus(b, 'refunded')}>
                                  Refund
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-section">
            <h3 className="section-title">Complaints Inbox</h3>
            {complaints.length === 0 ? (
              <div className="state-msg">No complaints — all clear.</div>
            ) : (
              complaints.map((c) => (
                <div key={c.$id} className="card admin-row">
                  <div>
                    <strong>{c.name}</strong> {c.bookingCode && <span className="ref-code">({c.bookingCode})</span>}{' '}
                    <span className={'badge badge-' + c.status}>{c.status}</span>
                    <div>{c.message}</div>
                    <small className="muted">{new Date(c.$createdAt).toLocaleString()}</small>
                  </div>
                  {c.status === 'open' && (
                    <button className="btn btn-primary" disabled={busy} onClick={() => resolveComplaint(c)}>
                      Mark Resolved
                    </button>
                  )}
                </div>
              ))
            )}
          </section>

          <section className="admin-section">
            <h3 className="section-title">Category Prices</h3>
            {categories.map((cat) => (
              <div key={cat.$id} className="card admin-row">
                <div>
                  <CategoryIcon category={cat} /> <strong>{cat.name}</strong>
                </div>
                <div className="btn-row">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="price-input"
                    value={priceEdits[cat.$id] ?? cat.priceUSD}
                    onChange={(e) => setPriceEdits((p) => ({ ...p, [cat.$id]: e.target.value }))}
                  />
                  <button className="btn btn-primary" disabled={busy} onClick={() => savePrice(cat)}>
                    Save
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="admin-section">
            <h3 className="section-title">Service Areas</h3>
            <form
              className="card admin-row area-add-row"
              onSubmit={(e) => {
                e.preventDefault()
                addArea()
              }}
            >
              <input
                type="text"
                placeholder="Add a new area, e.g. Harare - Borrowdale"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                maxLength={128}
              />
              <button className="btn btn-primary" type="submit" disabled={busy || !newArea.trim()}>
                <Plus className="icon" aria-hidden="true" /> Add area
              </button>
            </form>
            {areas.map((a) => (
              <div key={a.$id} className="card admin-row">
                <div>
                  <MapPin className="icon" aria-hidden="true" /> <strong>{a.name}</strong>
                </div>
                <button className="btn btn-small btn-danger" disabled={busy} onClick={() => removeArea(a)}>
                  <X className="icon" aria-hidden="true" /> Remove
                </button>
              </div>
            ))}
            {areas.length === 0 && <div className="state-msg">No areas yet. Add the first one above.</div>}
            <p className="area-hint">
              Areas appear in the browse filter and the worker registration form. Removing an area does not affect
              workers already registered in it.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
