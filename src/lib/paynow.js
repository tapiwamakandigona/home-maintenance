// PayNow Zimbabwe payment module.
//
// Currently SIMULATED, but shaped for a drop-in real integration.
//
// TODO: real PayNow integration point.
// When going live:
//   1. Set VITE_PAYNOW_INTEGRATION_ID and VITE_PAYNOW_INTEGRATION_KEY in the
//      build environment (never hardcode them in source).
//   2. Because the integration key must stay secret, the real flow should call
//      a server-side endpoint (e.g. an Appwrite Function) that creates the
//      PayNow transaction via https://www.paynow.co.zw/Interface/InitiateTransaction
//      (or the Express Checkout endpoint for EcoCash/OneMoney) and returns the
//      poll URL. The client then polls until status is "Paid".
//   3. Replace `simulatePayment` below with that call, keeping the same
//      return shape: { success, reference, method }.

export const PAYNOW_INTEGRATION_ID = import.meta.env.VITE_PAYNOW_INTEGRATION_ID || ''
export const PAYNOW_INTEGRATION_KEY = import.meta.env.VITE_PAYNOW_INTEGRATION_KEY || ''

export const PAYMENT_METHODS = [
  { id: 'ecocash', label: 'EcoCash', icon: '📱' },
  { id: 'onemoney', label: 'OneMoney', icon: '📱' },
  { id: 'telecash', label: 'Telecash', icon: '📱' },
  { id: 'zipit', label: 'ZIPIT', icon: '🏦' },
  { id: 'card', label: 'Visa / Mastercard', icon: '💳' },
]

/**
 * Simulate a PayNow payment. Resolves after ~2.5s of "Processing…".
 * @returns {Promise<{success: boolean, reference: string, method: string}>}
 */
export function simulatePayment({ amount, method, mobileNumber, email }) {
  void amount
  void mobileNumber
  void email
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        reference: 'PN-' + Date.now().toString(36).toUpperCase(),
        method,
      })
    }, 2500)
  })
}
