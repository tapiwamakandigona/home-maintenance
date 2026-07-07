import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function NavBar() {
  const { user, admin, myWorker, notifications, unreadCount, markAllRead, logout } = useApp()
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function openBell() {
    const next = !bellOpen
    setBellOpen(next)
    if (next) await markAllRead()
  }

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">
          <span className="nav-logo">🏠</span> Home Maintenance
        </Link>
        <nav className="nav-actions">
          {user ? (
            <>
              <Link to="/" className="nav-pill nav-pill-solid">
                Browse
              </Link>
              {user && (
                <div className="bell-wrap" ref={bellRef}>
                  <button className="nav-pill bell-btn" onClick={openBell} aria-label="Notifications">
                    🔔{unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
                  </button>
                  {bellOpen && (
                    <div className="bell-dropdown">
                      <div className="bell-head">Notifications</div>
                      {notifications.length === 0 ? (
                        <div className="bell-empty">No notifications yet.</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.$id} className="bell-item">
                            <strong>{n.title}</strong>
                            <span>{n.body}</span>
                            <small>{new Date(n.$createdAt).toLocaleString()}</small>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              {admin && (
                <Link to="/admin" className="nav-pill">
                  ⚙️ Admin
                </Link>
              )}
              <Link to="/bookings" className="nav-pill">
                My Bookings
              </Link>
              {myWorker && (
                <Link to="/dashboard" className="nav-pill">
                  Worker Dashboard
                </Link>
              )}
              <button className="nav-pill" onClick={handleLogout}>
                Logout ({user.email})
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/signup" className="nav-pill nav-pill-light">
                Sign Up
              </Link>
            </>
          )}
          <Link to="/register-worker" className="nav-pill">
            Register as Worker
          </Link>
        </nav>
      </div>
    </header>
  )
}
