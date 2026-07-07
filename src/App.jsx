import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Splash from './components/Splash'
import Onboarding from './components/Onboarding'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import Browse from './pages/Browse'
import Auth from './pages/Auth'
import RegisterWorker from './pages/RegisterWorker'
import Hire from './pages/Hire'
import MyBookings from './pages/MyBookings'
import WorkerDashboard from './pages/WorkerDashboard'
import Complaints from './pages/Complaints'
import Admin from './pages/Admin'
import { useApp } from './context/AppContext'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('hm_onboarded') === '1')
  const { refreshNotifications, user } = useApp()
  const location = useLocation()

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1500)
    return () => clearTimeout(t)
  }, [])

  // Refresh notifications on navigation
  useEffect(() => {
    if (user) refreshNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  if (!splashDone) return <Splash />
  if (!onboarded) {
    return (
      <Onboarding
        onDone={() => {
          localStorage.setItem('hm_onboarded', '1')
          setOnboarded(true)
        }}
      />
    )
  }

  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/register-worker" element={<RegisterWorker />} />
          <Route path="/hire/:workerId" element={<Hire />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/dashboard" element={<WorkerDashboard />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Browse />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
