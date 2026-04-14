import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { getSetUiClass, PLAYER_SETS, SET_LOGOS } from '../utils/auctionRules'

const WHEEL_BG = '#111f35'

/** Uniform fill with thin white rays between segments. */
function buildWheelConicGradient(segmentCount) {
  if (segmentCount <= 0) {
    return `conic-gradient(from 0deg at 50% 50%, ${WHEEL_BG} 0deg 360deg)`
  }
  if (segmentCount === 1) {
    return `conic-gradient(from 0deg at 50% 50%, ${WHEEL_BG} 0deg 360deg)`
  }
  const seg = 360 / segmentCount
  let borderDeg = 1.2
  if (seg < borderDeg * 2.5) {
    borderDeg = Math.max(0.35, seg * 0.12)
  }
  const b = borderDeg
  const parts = [`white 0deg ${b / 2}deg`]
  for (let k = 0; k < segmentCount; k += 1) {
    const c0 = k * seg + b / 2
    const c1 = (k + 1) * seg - b / 2
    parts.push(`${WHEEL_BG} ${c0}deg ${c1}deg`)
    if (k < segmentCount - 1) {
      const w0 = (k + 1) * seg - b / 2
      const w1 = (k + 1) * seg + b / 2
      parts.push(`white ${w0}deg ${w1}deg`)
    }
  }
  parts.push(`white ${360 - b / 2}deg 360deg`)
  return `conic-gradient(from 0deg at 50% 50%, ${parts.join(', ')})`
}

/** idle → spinning (wheel center) → reveal (big popup) → bidding (on the block) */
function AuctionPanel({
  teams,
  currentSet,
  currentPlayer,
  eligiblePlayers,
  setAuctionRound,
  unsoldWaitingInSet,
  message,
  onSetChange,
  onWheelSpinStart,
  onSelectPlayerFromWheel,
  onMarkUnsold,
  onSellPlayer,
}) {
  const [wheelRotation, setWheelRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [auctionPhase, setAuctionPhase] = useState(() =>
    currentPlayer ? 'bidding' : 'idle',
  )

  /** After sell/unsold, parent clears player — treat as idle without a syncing effect */
  const displayPhase =
    !currentPlayer && !isSpinning ? 'idle' : auctionPhase

  const spinFocused = displayPhase === 'spinning' || displayPhase === 'reveal'

  const handleSell = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const teamId = formData.get('teamId')?.toString()
    const bidAmount = Number(formData.get('bidAmount'))

    onSellPlayer({ teamId, bidAmount })
  }

  const spinWheel = () => {
    if (eligiblePlayers.length === 0 || isSpinning) {
      return
    }

    onWheelSpinStart?.()
    setAuctionPhase('spinning')

    const pickedIndex = Math.floor(Math.random() * eligiblePlayers.length)
    const segmentAngle = 360 / eligiblePlayers.length
    const centerAngle = (pickedIndex + 0.5) * segmentAngle
    const combined = centerAngle + wheelRotation
    const normalized = ((combined % 360) + 360) % 360
    let delta = (360 - normalized) % 360
    if (delta === 0) delta = 360
    const targetAngle = wheelRotation + 1440 + delta

    setIsSpinning(true)
    setWheelRotation(targetAngle)

    window.setTimeout(() => {
      onSelectPlayerFromWheel(eligiblePlayers[pickedIndex].id)
      setIsSpinning(false)
      setAuctionPhase('reveal')
    }, 2300)
  }

  const handleRevealNext = () => {
    setAuctionPhase('bidding')
  }

  const wheelDiscStyle = useMemo(() => {
    const n = eligiblePlayers.length
    const style = { transform: `rotate(${wheelRotation}deg)` }
    if (n === 0) return style
    return {
      ...style,
      background: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.98) 0 14.5%, transparent 15%), ${buildWheelConicGradient(n)}`,
    }
  }, [eligiblePlayers.length, wheelRotation])

  const revealModal =
    displayPhase === 'reveal' && currentPlayer
      ? createPortal(
          <div
            className="player-reveal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="player-reveal-name"
          >
            <div className="player-reveal-backdrop" aria-hidden="true" />
            <div className="player-reveal-inner" key={currentPlayer.id}>
              <span
                className={`player-reveal-set-badge mini-set-badge ${getSetUiClass(currentPlayer.set)}`}
              >
                {currentPlayer.set}
              </span>
              {currentPlayer.photoDataUrl ? (
                <img
                  src={currentPlayer.photoDataUrl}
                  alt=""
                  className="player-reveal-photo"
                />
              ) : (
                <div className="player-reveal-photo-placeholder" aria-hidden="true">
                  <span>{currentPlayer.name.slice(0, 1)}</span>
                </div>
              )}
              <h2 id="player-reveal-name" className="player-reveal-name">
                {currentPlayer.name}
              </h2>
              <p className="player-reveal-category">{currentPlayer.category}</p>
              <button type="button" className="btn-spin player-reveal-next" onClick={handleRevealNext}>
                Next
              </button>
              <p className="player-reveal-hint">Then record the bid in On the block</p>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <section className="card cricket-card auction-panel-card">
      <div className="section-head">
        <div>
          <h2 className="panel-title">Auction Panel</h2>
          <p className="section-note">
            Spin the wheel for the selected set. Unsold players join the wheel only after every
            still-available player in that set has been sold or marked unsold.
          </p>
        </div>
        <div className={`set-logo set-badge-lg ${getSetUiClass(currentSet)}`}>
          {SET_LOGOS[currentSet]}
        </div>
      </div>
      <div className="auction-controls auction-toolbar">
        <label className="auction-set-field">
          Current Set
          <select value={currentSet} onChange={(event) => onSetChange(event.target.value)}>
            {PLAYER_SETS.map((setName) => (
              <option key={setName} value={setName}>
                {setName}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn-spin"
          onClick={spinWheel}
          disabled={isSpinning || eligiblePlayers.length === 0}
        >
          {isSpinning ? 'Spinning…' : 'Spin the Wheel'}
        </button>
      </div>
      <p className="helper-text helper-pill">
        {setAuctionRound === 'unsold' ? (
          <>
            <span className="helper-count">{eligiblePlayers.length}</span> unsold (re-auction) in{' '}
            <strong>{currentSet}</strong>
          </>
        ) : setAuctionRound === 'available' ? (
          <>
            <span className="helper-count">{eligiblePlayers.length}</span> available in{' '}
            <strong>{currentSet}</strong>
            {unsoldWaitingInSet > 0 ? (
              <span className="helper-pill-hint">
                {' '}
                — {unsoldWaitingInSet} unsold after this round
              </span>
            ) : null}
          </>
        ) : (
          <>
            <span className="helper-count">0</span> players left in <strong>{currentSet}</strong>
          </>
        )}
      </p>

      <div
        className={`auction-layout${spinFocused ? ' auction-layout--spin-focused' : ''}`}
      >
        <div className="wheel-stage">
          <div className="wheel-wrap">
            <div className="wheel-pointer" />
            <div className="wheel-outer-ring">
              <div className="wheel-disc" style={wheelDiscStyle}>
                {eligiblePlayers.length === 0 ? (
                  <p className="wheel-empty">No players left in this set.</p>
                ) : (
                  eligiblePlayers.map((player, index) => {
                    const n = eligiblePlayers.length
                    const midAngle = (index + 0.5) * (360 / n)
                    return (
                      <span
                        key={player.id}
                        className="wheel-item"
                        style={{
                          transform: `translate(-50%, -50%) rotate(${midAngle}deg) translateY(var(--wheel-pull)) rotate(${-midAngle}deg)`,
                        }}
                      >
                        <span className="wheel-item-text wheel-item-text--on-light-wedge">
                          {player.name}
                        </span>
                      </span>
                    )
                  })
                )}
                <div className="wheel-hub" aria-hidden="true">
                  <span className="wheel-hub-ring" />
                  <span className="wheel-hub-label">{isSpinning ? '…' : 'SPL'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {displayPhase === 'idle' || displayPhase === 'bidding' ? (
          <div className="auction-side-column">
            <div className="current-player current-player-panel" aria-live="polite">
              <div className="current-player-head">
                <h3>On the block</h3>
                <span
                  className={`mini-set-badge ${getSetUiClass(
                    displayPhase === 'bidding' && currentPlayer ? currentPlayer.set : currentSet,
                  )}`}
                >
                  {displayPhase === 'bidding' && currentPlayer ? currentPlayer.set : currentSet}
                </span>
              </div>
              {displayPhase === 'bidding' && currentPlayer ? (
                <div className="player-bid-block">
                  <div className="player-spotlight">
                    <div className="player-spotlight-text">
                      <p className="player-spotlight-name">{currentPlayer.name}</p>
                      <p className="player-spotlight-meta">{currentPlayer.category}</p>
                    </div>
                    {currentPlayer.photoDataUrl ? (
                      <img
                        src={currentPlayer.photoDataUrl}
                        alt=""
                        className="player-spotlight-photo"
                      />
                    ) : null}
                  </div>
                  <form className="inline-form bid-form" onSubmit={handleSell}>
                    <label>
                      Winning Team
                      <select name="teamId" required defaultValue="">
                        <option value="" disabled>
                          Select Team
                        </option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.teamName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Final Bid
                      <input name="bidAmount" type="number" min="1" required placeholder="Points" />
                    </label>
                    <button type="submit" className="btn-sell">
                      Sell Player
                    </button>
                    <button type="button" className="btn-ghost" onClick={onMarkUnsold}>
                      Mark Unsold
                    </button>
                  </form>
                </div>
              ) : (
                <p className="current-player-empty">
                  Spin the wheel, then use <strong>Next</strong> on the reveal screen — bidding
                  appears here.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {message ? (
        <p
          className={`info-message info-message-auction${/exceeds|not enough|must be greater|Select a team|not eligible|No current player|already sold|not found|already has|maximum|go over|ceiling/i.test(message) ? " info-message--alert" : ""}`}
        >
          {message}
        </p>
      ) : null}

      {revealModal}
    </section>
  )
}

export default AuctionPanel
