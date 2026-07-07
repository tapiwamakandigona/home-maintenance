import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { account, ID } from '../lib/appwrite'
import { useApp } from '../context/AppContext'

export default function Auth({ mode }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshUser } = useApp()
  const isSignup = mode === 'signup'
  const redirectTo = location.state?.from || '/'

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSignup) {
        await account.create(ID.unique(), email, password, name || email.split('@')[0])
      }
      // ensure no stale session
      try {
        await account.deleteSession('current')
      } catch {
        // no existing session
      }
      await account.createEmailPasswordSession(email, password)
      await refreshUser()
      navigate(redirectTo)
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2 className="card-title">{isSignup ? 'Sign Up' : 'Login'}</h2>
        <form onSubmit={submit} className="form">
          {isSignup && (
            <div className="field">
              <label>Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create Account' : 'Login'}
          </button>
        </form>
        <p className="auth-switch">
          {isSignup ? (
            <>
              Already have an account? <Link to="/login">Login</Link>
            </>
          ) : (
            <>
              New here? <Link to="/signup">Sign Up</Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
