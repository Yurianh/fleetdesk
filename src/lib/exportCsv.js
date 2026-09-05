// CSV export helper. Produces an Excel-friendly file: UTF-8 BOM (so accented
// French text renders correctly), CRLF line endings, and RFC-4180 quoting.

function cell(value) {
  if (value == null) return ''
  let s = String(value)
  // Escape fields containing quotes, separators or newlines.
  if (/[";\n\r]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

/**
 * Trigger a CSV download.
 * @param {string} filename  base name, `.csv` appended if missing
 * @param {Array<{key:string,label:string,map?:(row)=>any}>} columns
 * @param {Array<object>} rows
 */
export function downloadCsv(filename, columns, rows) {
  // Semicolon separator — the default Excel expects in French locales.
  const SEP = ';'
  const header = columns.map(c => cell(c.label)).join(SEP)
  const body = rows.map(row =>
    columns.map(c => cell(c.map ? c.map(row) : row[c.key])).join(SEP)
  )
  const content = '﻿' + [header, ...body].join('\r\n')

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// A dated filename like "fleetdesk-vehicules-2026-09-05.csv".
export function datedName(base) {
  const d = new Date()
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `fleetdesk-${base}-${stamp}.csv`
}
