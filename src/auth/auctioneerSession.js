const SESSION_KEY = 'spl-auctioneer-authenticated'

/**
 * PIN is compared client-side (suitable for keeping casual viewers out, not for secrets).
 * Set `VITE_AUCTIONEER_PIN` in `.env` for production builds.
 */
export function getConfiguredAuctioneerPin() {
  const fromEnv = import.meta.env.VITE_AUCTIONEER_PIN
  if (fromEnv != null && String(fromEnv).length > 0) {
    return String(fromEnv)
  }
  if (import.meta.env.DEV) {
    return 'spl-dev'
  }
  return ''
}

export function isPinConfigured() {
  return getConfiguredAuctioneerPin().length > 0
}

export function isAuctioneerAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function setAuctioneerAuthenticated() {
  sessionStorage.setItem(SESSION_KEY, '1')
}

export function clearAuctioneerSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function verifyAuctioneerPin(pin) {
  const expected = getConfiguredAuctioneerPin()
  if (!expected) {
    return { ok: false, reason: 'not-configured' }
  }
  if (pin === expected) {
    return { ok: true, reason: 'ok' }
  }
  return { ok: false, reason: 'wrong' }
}
