/**
 * Builds a demo .xlsx with the columns expected by {@link parsePlayersExcel}.
 */
export async function downloadPlayersExcelTemplate() {
  const XLSX = await import('xlsx')

  const rows = [
    ['sr_no', 'name', 'category', 'set'],
    [1, 'Rahul (replace)', 'Batsman', 'Set A'],
    [2, 'Neel (replace)', 'Bowler', 'Set B'],
    [3, 'Dev (replace)', 'All-Rounder', 'Set C'],
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Players')

  XLSX.writeFile(workbook, 'SPL-players-template.xlsx')
}
