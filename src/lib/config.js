// Public client configuration — these are safe-to-expose client values.
export const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1'
export const APPWRITE_PROJECT = 'homemaintenance'
export const DATABASE_ID = 'main'

export const COLLECTIONS = {
  categories: 'categories',
  workers: 'workers',
  bookings: 'bookings',
  reviews: 'reviews',
  complaints: 'complaints',
  notifications: 'notifications',
}

export const ADMIN_TEAM_ID = 'admins'

// Platform fee: 30% of the booking amount is held as the platform fee.
export const PLATFORM_FEE_RATE = 0.3
