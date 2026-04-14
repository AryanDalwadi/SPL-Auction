import { useState } from 'react'
import {
  getConfiguredAuctioneerPin,
  isPinConfigured,
  setAuctioneerAuthenticated,
  verifyAuctioneerPin,
} from '../auth/auctioneerSession'

function AuctioneerLogin({ onSuccess }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    const result = verifyAuctioneerPin(pin.trim())
    if (result.ok) {
      setAuctioneerAuthenticated()
      onSuccess()
      return
    }
    if (result.reason === 'not-configured') {
      setError(
        'Auction PIN is not set for this deployment. Add VITE_AUCTIONEER_PIN to your environment and rebuild.',
      )
      return
    }
    setError('Incorrect PIN. Try again.')
  }

  return (
    <main className="app-layout auctioneer-login-layout">
      <section className="card cricket-card auctioneer-login-card">
        <p className="season-tag">SPL Season 4</p>
        <h1 className="auctioneer-login-title">Auctioneer access</h1>
        <p className="auctioneer-login-note">
          Enter the auction PIN to manage teams, players, and the live auction. Captain share links
          open without this screen.
        </p>

        {!isPinConfigured() ? (
          <p className="info-message info-message--alert auctioneer-login-warning">
            No PIN is configured for production. Set <code>VITE_AUCTIONEER_PIN</code> in your host
            environment (e.g. Netlify / Vercel env vars) and redeploy.
          </p>
        ) : null}

        {import.meta.env.DEV ? (
          <p className="auctioneer-login-dev-hint">
            Local dev PIN: <strong>{getConfiguredAuctioneerPin()}</strong> — override in{' '}
            <code>.env</code> with <code>VITE_AUCTIONEER_PIN</code>.
          </p>
        ) : null}

        <form className="auctioneer-login-form" onSubmit={handleSubmit}>
          <label className="auctioneer-login-label">
            PIN
            <input
              type="password"
              name="auctioneer-pin"
              autoComplete="current-password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Enter auction PIN"
              disabled={!isPinConfigured()}
              required
            />
          </label>
          {error ? <p className="auctioneer-login-error">{error}</p> : null}
          <button type="submit" className="btn-spin auctioneer-login-submit" disabled={!isPinConfigured()}>
            Unlock auction console
          </button>
        </form>
      </section>
    </main>
  )
}

export default AuctioneerLogin
