import { useMemo, useState } from 'react'
import { getSetUiClass, PLAYER_SETS, SET_LOGOS } from '../utils/auctionRules'

const WHEEL_SEGMENT_COLORS = [
  '#bfdbfe',
  '#bbf7d0',
  '#fde68a',
  '#fecaca',
  '#ddd6fe',
  '#a7f3d0',
  '#bae6fd',
]

function buildWheelConicGradient(segmentCount) {
  if (segmentCount <= 0) {
    return 'conic-gradient(from 0deg at 50% 50%, #e2e8f0 0deg 360deg)'
  }
  const parts = []
  for (let i = 0; i < segmentCount; i += 1) {
    const startDeg = (i * 360) / segmentCount
    const endDeg = i === segmentCount - 1 ? 360 : ((i + 1) * 360) / segmentCount
    const color = WHEEL_SEGMENT_COLORS[i % WHEEL_SEGMENT_COLORS.length]
    parts.push(`${color} ${startDeg}deg ${endDeg}deg`)
  }
  return `conic-gradient(from 0deg at 50% 50%, ${parts.join(', ')})`
}

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

    const pickedIndex = Math.floor(Math.random() * eligiblePlayers.length)
    const segmentAngle = 360 / eligiblePlayers.length
    // Conic gradient: 0° at top, increasing clockwise; pointer sits at top.
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
    }, 2300)
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
        <label className="field-grow">
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

      <div className="auction-layout">
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
                        <span className="wheel-item-text">{player.name}</span>
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

        <div className="auction-side-column">
          <div
            className={`admin-pick-ribbon${isSpinning ? ' admin-pick-ribbon--spinning' : ''}${currentPlayer ? ' admin-pick-ribbon--active' : ''}`}
            aria-live="polite"
          >
            <span className="admin-pick-eyebrow">Admin · who is on the block</span>
            {isSpinning ? (
              <p className="admin-pick-title">Drawing from the wheel…</p>
            ) : currentPlayer ? (
              <p className="admin-pick-title">{currentPlayer.name}</p>
            ) : (
              <p className="admin-pick-title admin-pick-title--muted">Spin the wheel to draw a player</p>
            )}
          </div>

          <div className="current-player current-player-panel">
            <div className="current-player-head">
              <h3>On the block</h3>
              {currentPlayer ? (
                <span className={`mini-set-badge ${getSetUiClass(currentPlayer.set)}`}>
                  {currentPlayer.set}
                </span>
              ) : null}
            </div>
            {currentPlayer ? (
              <div className="player-bid-block">
                <div className="player-spotlight">
                  <p className="player-spotlight-name">{currentPlayer.name}</p>
                  <p className="player-spotlight-meta">{currentPlayer.category}</p>
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
                No player yet — tap <strong>Spin the Wheel</strong>.
              </p>
            )}
          </div>
        </div>
      </div>

      {message ? (
        <p
          className={`info-message info-message-auction${/exceeds|not enough|must be greater|Select a team|not eligible|No current player|already sold|not found/i.test(message) ? " info-message--alert" : ""}`}
        >
          {message}
        </p>
      ) : null}
    </section>
  )
}

export default AuctionPanel
