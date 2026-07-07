import { Client, Account, Databases, Teams, Permission, Role, ID, Query } from 'appwrite'
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT, DATABASE_ID, COLLECTIONS, ADMIN_TEAM_ID } from './config'

const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT)

export const account = new Account(client)
export const databases = new Databases(client)
export const teams = new Teams(client)
export { client, Permission, Role, ID, Query, DATABASE_ID, COLLECTIONS, ADMIN_TEAM_ID }

// ---- helpers ----

export function db() {
  return databases
}

export async function getCurrentUser() {
  try {
    return await account.get()
  } catch {
    return null
  }
}

export async function isAdmin() {
  try {
    const res = await teams.list()
    return res.teams.some((t) => t.$id === ADMIN_TEAM_ID)
  } catch {
    return false
  }
}

export function bookingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return 'HM-' + s
}

// Permissions for document-security collections.
// NOTE: Appwrite rejects client-granted permissions for roles the creator does
// not hold — e.g. Permission.read(Role.team('admins')) or Role.user(<another
// user>) from a customer session fails the whole createDocument with 401
// "Permissions must be one of: (any, users, user:<self> …)". Admin and
// cross-user (worker) access is provided by the collections' collection-level
// permissions instead (verified live), so we only grant what the current user
// may grant: read/update for themselves.
export function userDocPermissions(userId) {
  return [Permission.read(Role.user(userId)), Permission.update(Role.user(userId))]
}
