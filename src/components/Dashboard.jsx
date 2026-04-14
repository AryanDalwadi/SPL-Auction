import { useMemo, useState } from 'react'
import { getSetUiClass, SET_LOGOS } from '../utils/auctionRules'

function Dashboard({
  teams,
  players,
  currentPlayer,
  currentSet,
  setLimits,
  onResetAuction,
  onExportData,
  onRevertSale,
}) {
  const [selectedTeamId, setSelectedTeamId] = useState('all')

  const soldPlayersByTeam = teams.map((team) => ({
    teamName: team.teamName,
    players: players.filter((player) => player.soldToTeamId === team.id),
  }))

  const leaderboard = [...teams].sort((a, b) => b.players.length - a.players.length)
  const boughtPlayers = useMemo(
    () => players.filter((player) => player.status === 'sold'),
    [players],
  )
  const filteredBoughtPlayers = useMemo(() => {
    if (selectedTeamId === 'all') return boughtPlayers
    return boughtPlayers.filter((player) => player.soldToTeamId === selectedTeamId)
  }, [boughtPlayers, selectedTeamId])
  const soldCount = boughtPlayers.length
  const unsoldCount = players.filter((player) => player.status === 'unsold').length

  return (
    <section className="card cricket-card dashboard-card">
      <div className="section-head">
        <div>
          <h2 className="panel-title">Dashboard</h2>
          <p className="section-note dashboard-meta">
            <span>
              Active set <strong>{currentSet}</strong>
            </span>
            <span className="meta-dot" aria-hidden="true" />
            <span>
              On block{' '}
              <strong>{currentPlayer ? currentPlayer.name : '—'}</strong>
            </span>
          </p>
        </div>
        <div className="chip-row">
          <span className="stat-chip stat-chip-sold">Sold {soldCount}</span>
          <span className="stat-chip stat-chip-unsold">Unsold {unsoldCount}</span>
        </div>
      </div>

      <div className="actions-row dashboard-actions">
        <button type="button" className="btn-secondary" onClick={onExportData}>
          Export JSON
        </button>
        <button type="button" className="danger btn-danger-outline" onClick={onResetAuction}>
          Reset Auction
        </button>
      </div>

      <h3 className="dashboard-heading">Teams overview</h3>
      <div className="table-shell">
        <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Total</th>
            <th>Remaining</th>
            <th>Set A</th>
            <th>Set B</th>
            <th>Set C</th>
          </tr>
        </thead>
        <tbody>
          {teams.length === 0 ? (
            <tr>
              <td colSpan="6">No teams available.</td>
            </tr>
          ) : (
            teams.map((team) => (
              <tr key={team.id}>
                <td>{team.teamName}</td>
                <td>{team.totalPoints}</td>
                <td>{team.remainingPoints}</td>
                <td>
                  <span className={`set-logo inline ${getSetUiClass('Set A')}`}>{SET_LOGOS['Set A']}</span>
                  <br />
                  {team.spentBySet['Set A']}/{setLimits['Set A']}
                </td>
                <td>
                  <span className={`set-logo inline ${getSetUiClass('Set B')}`}>{SET_LOGOS['Set B']}</span>
                  <br />
                  {team.spentBySet['Set B']}/{setLimits['Set B']}
                </td>
                <td>
                  <span className={`set-logo inline ${getSetUiClass('Set C')}`}>{SET_LOGOS['Set C']}</span>
                  <br />
                  {team.spentBySet['Set C']}/{setLimits['Set C']}
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>

      <h3 className="dashboard-heading">Sold players by team</h3>
      <div className="two-column-grid sold-grid">
        {soldPlayersByTeam.map((entry) => (
          <article key={entry.teamName} className="sub-card sold-team-card">
            <h4 className="sold-team-title">{entry.teamName}</h4>
            {entry.players.length === 0 ? (
              <p className="sold-empty">No players bought yet.</p>
            ) : (
              <ul className="sold-list">
                {entry.players.map((player) => (
                  <li key={player.id} className="sold-list-item">
                    <span className="sold-list-name">{player.name}</span>
                    <span className="sold-list-bid">{player.finalBid} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      <h3 className="dashboard-heading">Leaderboard</h3>
      <ol className="leaderboard-list">
        {leaderboard.map((team, index) => (
          <li key={team.id} className="leaderboard-row">
            <span className="leaderboard-rank">{index + 1}</span>
            <span className="leaderboard-name">{team.teamName}</span>
            <span className="leaderboard-count">{team.players.length} bought</span>
          </li>
        ))}
      </ol>

      <h3 className="dashboard-heading">Bought players</h3>
      <div className="filter-row">
        <label>
          Team Name
          <select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
            <option value="all">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.teamName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-shell">
        <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Set</th>
            <th>Sold To</th>
            <th>Bid</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBoughtPlayers.length === 0 ? (
            <tr>
              <td colSpan="6">No bought players found for selected team.</td>
            </tr>
          ) : (
            filteredBoughtPlayers.map((player) => {
              const soldTeam = teams.find((team) => team.id === player.soldToTeamId)
              return (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>{player.category}</td>
                  <td>
                    <span className={`set-logo inline ${getSetUiClass(player.set)}`}>
                      {SET_LOGOS[player.set]}
                    </span>
                  </td>
                  <td>{soldTeam?.teamName ?? '-'}</td>
                  <td>{player.finalBid ?? '-'}</td>
                  <td>
                    <button type="button" onClick={() => onRevertSale(player.id)}>
                      Revert Sale
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
        </table>
      </div>
    </section>
  )
}

export default Dashboard
