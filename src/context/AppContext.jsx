import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { account, databases, isAdmin, Query, DATABASE_ID, COLLECTIONS } from '../lib/appwrite'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(false)
  const [myWorker, setMyWorker] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [authChecked, setAuthChecked] = useState(false)
  const pollRef = useRef(null)

  const loadNotifications = useCallback(async (u) => {
    const who = u || null
    if (!who) {
      setNotifications([])
      return
    }
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.notifications, [
        Query.equal('userId', who.$id),
        Query.orderDesc('$createdAt'),
        Query.limit(50),
      ])
      setNotifications(res.documents)
    } catch {
      // ignore — notifications are best-effort
    }
  }, [])

  const loadMyWorker = useCallback(async (u) => {
    if (!u) {
      setMyWorker(null)
      return
    }
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.workers, [
        Query.equal('userId', u.$id),
        Query.limit(1),
      ])
      setMyWorker(res.documents[0] || null)
    } catch {
      setMyWorker(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    let u = null
    try {
      u = await account.get()
    } catch {
      u = null
    }
    setUser(u)
    if (u) {
      setAdmin(await isAdmin())
    } else {
      setAdmin(false)
    }
    await Promise.all([loadMyWorker(u), loadNotifications(u)])
    setAuthChecked(true)
    return u
  }, [loadMyWorker, loadNotifications])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Poll notifications every ~30s
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (user) {
      pollRef.current = setInterval(() => loadNotifications(user), 30000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [user, loadNotifications])

  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current')
    } catch {
      // already logged out
    }
    setUser(null)
    setAdmin(false)
    setMyWorker(null)
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read)
    if (!unread.length) return
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    for (const n of unread) {
      try {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.notifications, n.$id, { read: true })
      } catch {
        // best-effort
      }
    }
  }, [notifications])

  const value = {
    user,
    admin,
    myWorker,
    notifications,
    unreadCount,
    authChecked,
    refreshUser,
    refreshWorker: () => loadMyWorker(user),
    refreshNotifications: () => loadNotifications(user),
    markAllRead,
    logout,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
