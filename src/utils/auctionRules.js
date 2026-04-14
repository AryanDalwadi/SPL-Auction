export const SET_LIMITS = {
  'Set A': 750,
  'Set B': 1000,
  'Set C': 1200,
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

export function getEligiblePlayers(players, currentSet) {
  return players.filter((player) => {
    if (player.set !== currentSet) return false
    return player.status === 'available' || player.status === 'unsold'
  })
}

export function pickRandomPlayer(players, currentSet) {
  const eligiblePlayers = getEligiblePlayers(players, currentSet)
  if (eligiblePlayers.length === 0) return null
  const randomIndex = Math.floor(Math.random() * eligiblePlayers.length)
  return eligiblePlayers[randomIndex]
}

export function validateSale({ team, playerSet, bidAmount }) {
  if (!team) {
    return { valid: false, message: 'Select a team before selling the player.' }
  }

  if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
    return { valid: false, message: 'Bid amount must be greater than 0.' }
  }

  if (team.remainingPoints < bidAmount) {
    return { valid: false, message: 'Team does not have enough remaining points.' }
  }

  const setLimit = SET_LIMITS[playerSet] ?? Number.POSITIVE_INFINITY
  const spentForSet = team.spentBySet[playerSet] ?? 0
  if (spentForSet + bidAmount > setLimit) {
    return {
      valid: false,
      message: `${team.teamName} exceeds ${playerSet} limit of ${setLimit}.`,
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
