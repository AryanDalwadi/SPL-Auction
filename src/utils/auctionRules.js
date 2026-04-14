export const SET_LIMITS = {
  'Set A': 750,
  'Set B': 1000,
  'Set C': 1200,
}

/** Max number of bought players per team from each set (auction roster cap). */
export const SET_ROSTER_LIMITS = {
  'Set A': 2,
  'Set B': 2,
  'Set C': 3,
}

export const PLAYER_CATEGORIES = ['Batsman', 'Bowler', 'All-Rounder']
export const PLAYER_SETS = Object.keys(SET_LIMITS)
export const SET_LOGOS = {
  'Set A': 'Set A',
  'Set B': 'Set B',
  'Set C': 'Set C',
}

export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `id-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

/**
 * Set auction runs in two passes: all `available` players first, then only `unsold`
 * (re-auction) after no `available` players remain in that set.
 */
export function getSetAuctionEligibility(players, currentSet) {
  const inSet = players.filter((player) => player.set === currentSet)
  const available = inSet.filter((player) => player.status === 'available')
  if (available.length > 0) {
    return { eligible: available, round: 'available' }
  }
  const unsold = inSet.filter((player) => player.status === 'unsold')
  return {
    eligible: unsold,
    round: unsold.length > 0 ? 'unsold' : 'none',
  }
}

export function getEligiblePlayers(players, currentSet) {
  return getSetAuctionEligibility(players, currentSet).eligible
}

export function pickRandomPlayer(players, currentSet) {
  const eligiblePlayers = getEligiblePlayers(players, currentSet)
  if (eligiblePlayers.length === 0) return null
  const randomIndex = Math.floor(Math.random() * eligiblePlayers.length)
  return eligiblePlayers[randomIndex]
}

/** Points already committed (all sets combined): total budget minus wallet. */
export function getTotalPointsSpentByTeam(team) {
  return Math.max(0, team.totalPoints - team.remainingPoints)
}

/**
 * Room left under a set’s printed cap after counting the team’s **total** spend.
 * Example: spent 250 → Set A shows 500 left (750−250), Set B 750 (1000−250), Set C 950 (1200−250).
 */
export function getRemainingRoomUnderSetCap(team, setName) {
  const cap = SET_LIMITS[setName]
  if (cap == null) return 0
  return Math.max(0, cap - getTotalPointsSpentByTeam(team))
}

export function countSoldPlayersForTeamInSet(players, teamId, setName) {
  return players.filter(
    (player) =>
      player.status === 'sold' &&
      player.soldToTeamId === teamId &&
      player.set === setName,
  ).length
}

export function validateSale({ team, playerSet, bidAmount, players, teamId }) {
  if (!team) {
    return { valid: false, message: 'Select a team before selling the player.' }
  }

  if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
    return { valid: false, message: 'Bid amount must be greater than 0.' }
  }

  if (team.remainingPoints < bidAmount) {
    return { valid: false, message: 'Team does not have enough remaining points.' }
  }

  const rosterLimit = SET_ROSTER_LIMITS[playerSet]
  if (
    rosterLimit != null &&
    players &&
    teamId &&
    countSoldPlayersForTeamInSet(players, teamId, playerSet) >= rosterLimit
  ) {
    return {
      valid: false,
      message: `${team.teamName} already has the maximum ${rosterLimit} bought players from ${playerSet}.`,
    }
  }

  const cap = SET_LIMITS[playerSet]
  if (cap != null) {
    const spentTotal = getTotalPointsSpentByTeam(team)
    if (spentTotal + bidAmount > cap) {
      return {
        valid: false,
        message: `${team.teamName} would go over the ${playerSet} ceiling (${cap}). Team has spent ${spentTotal} points in total across all sets.`,
      }
    }
  }

  return { valid: true, message: '' }
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function getSetUiClass(setName) {
  return setName.toLowerCase().replace(/\s+/g, '-')
}

function encodeBase64Url(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function buildTeamShareLink(payload) {
  if (typeof window === 'undefined') return ''
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  return `${window.location.origin}${window.location.pathname}?teamShare=${encodedPayload}`
}

export function readSharedTeamFromUrl() {
  if (typeof window === 'undefined') return null
  const searchParams = new URLSearchParams(window.location.search)
  const encodedPayload = searchParams.get('teamShare')
  if (!encodedPayload) return null

  try {
    const decodedPayload = decodeBase64Url(encodedPayload)
    const parsedPayload = JSON.parse(decodedPayload)
    if (
      typeof parsedPayload.teamName !== 'string' ||
      typeof parsedPayload.captainName !== 'string' ||
      !Array.isArray(parsedPayload.players)
    ) {
      return null
    }
    return parsedPayload
  } catch (error) {
    console.error('Failed to read shared team payload.', error)
    return null
  }
}
