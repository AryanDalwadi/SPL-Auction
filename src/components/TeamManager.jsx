import { useState } from 'react'

function TeamManager({ teams, onAddTeam, onUpdateTeam, onShareTeamLink }) {
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [editTeamName, setEditTeamName] = useState('')
  const [editCaptainName, setEditCaptainName] = useState('')
  const [editTotalPoints, setEditTotalPoints] = useState('')
  const [shareLinksByTeamId, setShareLinksByTeamId] = useState({})

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const teamName = formData.get('teamName')?.toString().trim()
    const captainName = formData.get('captainName')?.toString().trim()
    const totalPoints = Number(formData.get('totalPoints'))

    if (!teamName || !captainName || !Number.isFinite(totalPoints) || totalPoints <= 0) {
      return
    }

    onAddTeam({
      teamName,
      captainName,
      totalPoints,
    })

    event.currentTarget.reset()
  }

  const startEdit = (team) => {
    setEditingTeamId(team.id)
    setEditTeamName(team.teamName)
    setEditCaptainName(team.captainName)
    setEditTotalPoints(String(team.totalPoints))
  }

  const cancelEdit = () => {
    setEditingTeamId(null)
    setEditTeamName('')
    setEditCaptainName('')
    setEditTotalPoints('')
  }

  const saveEdit = (teamId) => {
    const totalPoints = Number(editTotalPoints)
    if (!editTeamName.trim() || !editCaptainName.trim() || !Number.isFinite(totalPoints) || totalPoints <= 0) {
      return
    }

    onUpdateTeam({
      teamId,
      teamName: editTeamName.trim(),
      captainName: editCaptainName.trim(),
      totalPoints,
    })
    cancelEdit()
  }

  const generateShareLink = (teamId) => {
    const link = onShareTeamLink(teamId)
    if (!link) return
    setShareLinksByTeamId((prev) => ({
      ...prev,
      [teamId]: link,
    }))
  }

  const totalTeams = teams.length
  const totalRemaining = teams.reduce((sum, team) => sum + team.remainingPoints, 0)

  return (
    <section className="card cricket-card">
      <div className="section-head">
        <div>
          <h2 className="panel-title">Team Management</h2>
          <p className="section-note">Create and maintain squads with captain and budget controls.</p>
        </div>
        <div className="chip-row">
          <span className="stat-chip">Teams: {totalTeams}</span>
          <span className="stat-chip">Total Remaining: {totalRemaining}</span>
        </div>
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Team Name
          <input name="teamName" required />
        </label>
        <label>
          Captain Name
          <input name="captainName" required />
        </label>
        <label>
          Total Points
          <input name="totalPoints" type="number" min="1" defaultValue="1200" required />
        </label>
        <button type="submit">Add Team</button>
      </form>

      <div className="table-shell">
        <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Captain</th>
            <th>Total</th>
            <th>Remaining</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teams.length === 0 ? (
            <tr>
              <td colSpan="5">No teams added yet.</td>
            </tr>
          ) : (
            teams.map((team) => (
              <tr key={team.id}>
                <td>
                  {editingTeamId === team.id ? (
                    <input value={editTeamName} onChange={(event) => setEditTeamName(event.target.value)} />
                  ) : (
                    team.teamName
                  )}
                </td>
                <td>
                  {editingTeamId === team.id ? (
                    <input
                      value={editCaptainName}
                      onChange={(event) => setEditCaptainName(event.target.value)}
                    />
                  ) : (
                    team.captainName
                  )}
                </td>
                <td>
                  {editingTeamId === team.id ? (
                    <input
                      type="number"
                      min="1"
                      value={editTotalPoints}
                      onChange={(event) => setEditTotalPoints(event.target.value)}
                    />
                  ) : (
                    team.totalPoints
                  )}
                </td>
                <td>{team.remainingPoints}</td>
                <td>
                  {editingTeamId === team.id ? (
                    <div className="table-actions">
                      <button type="button" onClick={() => saveEdit(team.id)}>
                        Save
                      </button>
                      <button type="button" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="table-actions">
                      <button type="button" onClick={() => startEdit(team)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => generateShareLink(team.id)}>
                        Share Link
                      </button>
                    </div>
                  )}
                  {shareLinksByTeamId[team.id] ? (
                    <div className="share-link-box">
                      <input
                        readOnly
                        value={shareLinksByTeamId[team.id]}
                        onFocus={(event) => event.target.select()}
                      />
                      <a href={shareLinksByTeamId[team.id]} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
    </section>
  )
}

export default TeamManager
