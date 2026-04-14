import * as XLSX from 'xlsx'
import { PLAYER_CATEGORIES, PLAYER_SETS } from './auctionRules'

function normalizeHeader(key) {
  return String(key ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function rowToRecord(row) {
  const rec = {}
  for (const [k, v] of Object.entries(row)) {
    rec[normalizeHeader(k)] = v
  }
  return rec
}

function cellToString(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return String(value).trim()
}

function matchSet(raw) {
  const s = cellToString(raw)
  if (!s) return null
  const exact = PLAYER_SETS.find((set) => set.toLowerCase() === s.toLowerCase())
  if (exact) return exact
  const compact = s.replace(/\s+/g, '').toLowerCase()
  if (compact === 'seta' || compact === 'a') return 'Set A'
  if (compact === 'setb' || compact === 'b') return 'Set B'
  if (compact === 'setc' || compact === 'c') return 'Set C'
  return null
}

function matchCategory(raw) {
  const s = cellToString(raw)
  if (!s) return null
  const exact = PLAYER_CATEGORIES.find((c) => c.toLowerCase() === s.toLowerCase())
  if (exact) return exact
  const norm = s.toLowerCase().replace(/[-\s]+/g, '')
  if (norm === 'allrounder' || norm === 'all-rounder') return 'All-Rounder'
  if (norm === 'batsman') return 'Batsman'
  if (norm === 'bowler') return 'Bowler'
  return null
}

/**
 * @param {ArrayBuffer} arrayBuffer
 * @returns {{ rows: Array<{ sr_no: string, name: string, category: string, set: string }>, errors: string[] }}
 */
export function parsePlayersExcel(arrayBuffer) {
  const errors = []
  const rows = []

  let workbook
  try {
    workbook = XLSX.read(arrayBuffer, { type: 'array' })
  } catch {
    return { rows: [], errors: ['Could not read that file. Use .xlsx or .xls.'] }
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { rows: [], errors: ['The workbook has no sheets.'] }
  }

  const sheet = workbook.Sheets[sheetName]
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })

  if (!json.length) {
    return { rows: [], errors: ['The first sheet is empty.'] }
  }

  const first = rowToRecord(json[0])
  const hasName = 'name' in first
  if (!hasName) {
    return {
      rows: [],
      errors: [
        'Missing a "name" column. Use headers: sr_no, name, category, set (any similar spelling).',
      ],
    }
  }

  json.forEach((rawRow, index) => {
    const r = rowToRecord(rawRow)
    const srNo = r.sr_no != null && r.sr_no !== '' ? cellToString(r.sr_no) : String(index + 1)
    const name = cellToString(r.name)
    if (!name) {
      errors.push(`Row ${srNo}: name is empty (skipped).`)
      return
    }

    const category = matchCategory(r.category)
    if (!category) {
      errors.push(
        `Row ${srNo} (${name}): invalid category "${cellToString(r.category)}". Use: ${PLAYER_CATEGORIES.join(', ')}.`,
      )
      return
    }

    const set = matchSet(r.set)
    if (!set) {
      errors.push(
        `Row ${srNo} (${name}): invalid set "${cellToString(r.set)}". Use: ${PLAYER_SETS.join(', ')}.`,
      )
      return
    }

    rows.push({ sr_no: srNo, name, category, set })
  })

  return { rows, errors }
}
