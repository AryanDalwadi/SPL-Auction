import { useState } from 'react'
import { getSetUiClass, PLAYER_CATEGORIES, PLAYER_SETS, SET_LOGOS } from '../utils/auctionRules'

function PlayerManager({
  players,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onImportPlayers,
  onSetPlayerPhoto,
  onNotify,
}) {
  const [importErrors, setImportErrors] = useState([])
  const [importBusy, setImportBusy] = useState(false)
  const [templateBusy, setTemplateBusy] = useState(false)

  const [editingPlayerId, setEditingPlayerId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState(PLAYER_CATEGORIES[0])
  const [editSet, setEditSet] = useState(PLAYER_SETS[0])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const name = formData.get('name')?.toString().trim()
    const category = formData.get('category')?.toString()
    const set = formData.get('set')?.toString()

    if (!name || !category || !set) {
      return
    }

    const photoFile = formData.get('photo')
    let photoDataUrl = null
    if (photoFile instanceof File && photoFile.size > 0) {
      try {
        const { processImageFile } = await import('../utils/imageUpload.js')
        photoDataUrl = await processImageFile(photoFile, { maxSide: 220 })
      } catch (err) {
        onNotify?.(err instanceof Error ? err.message : 'Photo upload failed.')
        return
      }
    }

    onAddPlayer({ name, category, set, photoDataUrl })
    event.currentTarget.reset()
  }

  const handlePlayerPhotoFile = async (playerId, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file?.size || !onSetPlayerPhoto) return
    try {
      const { processImageFile } = await import('../utils/imageUpload.js')
      const url = await processImageFile(file, { maxSide: 220 })
      onSetPlayerPhoto(playerId, url)
    } catch (err) {
      onNotify?.(err instanceof Error ? err.message : 'Photo upload failed.')
    }
  }

  const startEdit = (player) => {
    if (player.status === 'sold') {
      return
    }

    setEditingPlayerId(player.id)
    setEditName(player.name)
    setEditCategory(player.category)
    setEditSet(player.set)
  }

  const cancelEdit = () => {
    setEditingPlayerId(null)
    setEditName('')
    setEditCategory(PLAYER_CATEGORIES[0])
    setEditSet(PLAYER_SETS[0])
  }

  const saveEdit = (playerId) => {
    if (!editName.trim()) return

    onUpdatePlayer({
      playerId,
      name: editName.trim(),
      category: editCategory,
      set: editSet,
    })
    cancelEdit()
  }

  const handleDeletePlayer = (player) => {
    if (!onDeletePlayer) return
    if (editingPlayerId === player.id) cancelEdit()
    onDeletePlayer(player.id)
  }

  const totalPlayers = players.length
  const availablePlayers = players.filter((player) => player.status === 'available').length
  const soldPlayers = players.filter((player) => player.status === 'sold').length
  const unsoldPlayers = players.filter((player) => player.status === 'unsold').length

  const handleExcelChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !onImportPlayers) return

    setImportErrors([])
    setImportBusy(true)
    try {
      const { parsePlayersExcel } = await import('../utils/parsePlayersExcel.js')
      const buffer = await file.arrayBuffer()
      const { rows, errors } = parsePlayersExcel(buffer)
      setImportErrors(errors)
      if (rows.length) {
        onImportPlayers(rows)
      } else if (!errors.length) {
        setImportErrors(['No data rows found after the header row.'])
      }
    } catch {
      setImportErrors(['Could not read the file. Try saving as .xlsx from Excel.'])
    } finally {
      setImportBusy(false)
    }
  }

  const handleDownloadTemplate = async () => {
    setTemplateBusy(true)
    try {
      const { downloadPlayersExcelTemplate } = await import(
        '../utils/downloadPlayersExcelTemplate.js',
      )
      await downloadPlayersExcelTemplate()
    } catch {
      setImportErrors(['Could not generate the template file. Try again.'])
    } finally {
      setTemplateBusy(false)
    }
  }

  return (
    <section className="card cricket-card">
      <div className="section-head">
        <div>
          <h2 className="panel-title">Player Management</h2>
          <p className="section-note">Register players by category and set before spinning the auction wheel.</p>
        </div>
        <div className="chip-row">
          <span className="stat-chip">Total: {totalPlayers}</span>
          <span className="stat-chip">Available: {availablePlayers}</span>
          <span className="stat-chip">Sold: {soldPlayers}</span>
          <span className="stat-chip">Unsold: {unsoldPlayers}</span>
        </div>
      </div>

      <div className="excel-import-block">
        <h3 className="excel-import-heading">Import from Excel</h3>
        <p className="excel-import-hint">
          First sheet: columns <strong>sr_no</strong>, <strong>name</strong>, <strong>category</strong>,{' '}
          <strong>set</strong> (header row required). Category: {PLAYER_CATEGORIES.join(', ')}. Set:{' '}
          {PLAYER_SETS.join(', ')}.
        </p>
        <div className="excel-import-actions">
          <button
            type="button"
            className="btn-secondary excel-template-btn"
            onClick={handleDownloadTemplate}
            disabled={templateBusy}
          >
            {templateBusy ? 'Preparing…' : 'Download example Excel'}
          </button>
          <span className="excel-import-or" aria-hidden="true">
            then
          </span>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="excel-file-input"
            onChange={handleExcelChange}
            disabled={importBusy || !onImportPlayers}
          />
          {importBusy ? <span className="excel-import-status">Reading file…</span> : null}
        </div>
        <p className="excel-import-template-note">
          The file includes sample rows — replace names and add more lines, then import here.
        </p>
        {importErrors.length > 0 ? (
          <ul className="excel-import-errors">
            {importErrors.map((line, i) => (
              <li key={`${i}-${line.slice(0, 40)}`}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Player Name
          <input name="name" required />
        </label>
        <label>
          Category
          <select name="category" defaultValue={PLAYER_CATEGORIES[0]}>
            {PLAYER_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Set
          <select name="set" defaultValue={PLAYER_SETS[0]}>
            {PLAYER_SETS.map((setName) => (
              <option key={setName} value={setName}>
                {setName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Player photo (optional)
          <input name="photo" type="file" accept="image/*" />
        </label>
        <button type="submit">Add Player</button>
      </form>

      <div className="table-shell">
        <table>
        <thead>
          <tr>
            <th>Photo</th>
            <th>Name</th>
            <th>Category</th>
            <th>Set</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            <tr>
              <td colSpan="6">No players added yet.</td>
            </tr>
          ) : (
            players.map((player) => (
              <tr key={player.id}>
                <td className="media-table-cell">
                  <div className="media-thumb-stack">
                    {player.photoDataUrl ? (
                      <img src={player.photoDataUrl} alt="" className="player-photo-thumb" />
                    ) : (
                      <span className="media-thumb-placeholder is-round" aria-hidden="true">
                        —
                      </span>
                    )}
                    {player.status !== 'sold' &&
                    editingPlayerId !== player.id &&
                    onSetPlayerPhoto ? (
                      <div className="media-thumb-actions">
                        <label className="btn-ghost btn-tiny file-upload-label">
                          {player.photoDataUrl ? 'Change' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only-input"
                            onChange={(e) => handlePlayerPhotoFile(player.id, e)}
                          />
                        </label>
                        {player.photoDataUrl ? (
                          <button
                            type="button"
                            className="btn-ghost btn-tiny"
                            onClick={() => onSetPlayerPhoto(player.id, null)}
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td>
                  {editingPlayerId === player.id ? (
                    <input value={editName} onChange={(event) => setEditName(event.target.value)} />
                  ) : (
                    player.name
                  )}
                </td>
                <td>
                  {editingPlayerId === player.id ? (
                    <select value={editCategory} onChange={(event) => setEditCategory(event.target.value)}>
                      {PLAYER_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  ) : (
                    player.category
                  )}
                </td>
                <td>
                  {editingPlayerId === player.id ? (
                    <select value={editSet} onChange={(event) => setEditSet(event.target.value)}>
                      {PLAYER_SETS.map((setName) => (
                        <option key={setName} value={setName}>
                          {setName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`set-logo inline ${getSetUiClass(player.set)}`}>
                      {SET_LOGOS[player.set]}
                    </span>
                  )}
                </td>
                <td>{player.status}</td>
                <td>
                  {editingPlayerId === player.id ? (
                    <div className="table-actions">
                      <button type="button" onClick={() => saveEdit(player.id)}>
                        Save
                      </button>
                      <button type="button" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="table-actions">
                      <button type="button" onClick={() => startEdit(player)} disabled={player.status === 'sold'}>
                        Edit
                      </button>
                      {onDeletePlayer && player.status !== 'sold' ? (
                        <button
                          type="button"
                          className="btn-danger-outline"
                          onClick={() => handleDeletePlayer(player)}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  )}
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

export default PlayerManager
