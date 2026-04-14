import { useState } from 'react'
import { getSetUiClass, PLAYER_CATEGORIES, PLAYER_SETS, SET_LOGOS } from '../utils/auctionRules'

function PlayerManager({ players, onAddPlayer, onUpdatePlayer }) {
  const [editingPlayerId, setEditingPlayerId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState(PLAYER_CATEGORIES[0])
  const [editSet, setEditSet] = useState(PLAYER_SETS[0])

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const name = formData.get('name')?.toString().trim()
    const category = formData.get('category')?.toString()
    const set = formData.get('set')?.toString()

    if (!name || !category || !set) {
      return
    }

    onAddPlayer({ name, category, set })
    event.currentTarget.reset()
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

  const totalPlayers = players.length
  const availablePlayers = players.filter((player) => player.status === 'available').length
  const soldPlayers = players.filter((player) => player.status === 'sold').length
  const unsoldPlayers = players.filter((player) => player.status === 'unsold').length

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
        <button type="submit">Add Player</button>
      </form>

      <div className="table-shell">
        <table>
        <thead>
          <tr>
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
              <td colSpan="5">No players added yet.</td>
            </tr>
          ) : (
            players.map((player) => (
              <tr key={player.id}>
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
                    <button type="button" onClick={() => startEdit(player)} disabled={player.status === 'sold'}>
                      Edit
                    </button>
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
