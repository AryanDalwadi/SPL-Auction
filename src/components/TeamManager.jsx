import { useState } from 'react'

function TeamManager({
  teams,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  onShareTeamLink,
  onSetTeamLogo,
  onNotify,
}) {
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [editTeamName, setEditTeamName] = useState('')
  const [editCaptainName, setEditCaptainName] = useState('')
  const [editTotalPoints, setEditTotalPoints] = useState('')
  const [shareLinksByTeamId, setShareLinksByTeamId] = useState({})

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const teamName = formData.get('teamName')?.toString().trim()
    const captainName = formData.get('captainName')?.toString().trim()
    const totalPoints = Number(formData.get('totalPoints'))

    if (!teamName || !captainName || !Number.isFinite(totalPoints) || totalPoints <= 0) {
      return
    }

    const logoFile = formData.get('logo')
    let logoDataUrl = null
    if (logoFile instanceof File && logoFile.size > 0) {
      try {
        const { processImageFile } = await import('../utils/imageUpload.js')
        logoDataUrl = await processImageFile(logoFile, { maxSide: 280 })
      } catch (err) {
        onNotify?.(err instanceof Error ? err.message : 'Logo upload failed.')
        return
      }
    }

    onAddTeam({
      teamName,
      captainName,
      totalPoints,
      logoDataUrl,
    })

    event.currentTarget.reset()
  }

  const handleTeamLogoFile = async (teamId, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file?.size || !onSetTeamLogo) return
    try {
      const { processImageFile } = await import('../utils/imageUpload.js')
      const url = await processImageFile(file, { maxSide: 280 })
      onSetTeamLogo(teamId, url)
    } catch (err) {
      onNotify?.(err instanceof Error ? err.message : 'Logo upload failed.')
    }
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

  const handleDeleteTeam = (team) => {
    if (!onDeleteTeam) return
    if (editingTeamId === team.id) cancelEdit()
    onDeleteTeam(team.id)
    setShareLinksByTeamId((prev) => {
      const next = { ...prev }
      delete next[team.id]
      return next
    })
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
        <label>
          Team logo (optional)
          <input name="logo" type="file" accept="image/*" />
        </label>
        <button type="submit">Add Team</button>
      </form>

      <div className="table-shell">
        <table>
        <thead>
          <tr>
            <th>Logo</th>
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
              <td colSpan="6">No teams added yet.</td>
            </tr>
          ) : (
            teams.map((team) => (
              <tr key={team.id}>
                <td className="media-table-cell">
                  <div className="media-thumb-stack">
                    {team.logoDataUrl ? (
                      <img src={team.logoDataUrl} alt="" className="team-logo-thumb" />
                    ) : (
                      <span className="media-thumb-placeholder" aria-hidden="true">
                        —
                      </span>
                    )}
                    {editingTeamId !== team.id ? (
                      <div className="media-thumb-actions">
                        <label className="btn-ghost btn-tiny file-upload-label">
                          {team.logoDataUrl ? 'Change' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only-input"
                            onChange={(e) => handleTeamLogoFile(team.id, e)}
                          />
                        </label>
                        {team.logoDataUrl && onSetTeamLogo ? (
                          <button
                            type="button"
                            className="btn-ghost btn-tiny"
                            onClick={() => onSetTeamLogo(team.id, null)}
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </td>
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
                      {onDeleteTeam ? (
                        <button
                          type="button"
                          className="btn-danger-outline"
                          onClick={() => handleDeleteTeam(team)}
                        >
                          Delete
                        </button>
                      ) : null}
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
