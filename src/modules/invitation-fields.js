import { normalizeKhmerName } from './khmer-name.js'
export const DEFAULT_GROUPS = ['Unassigned', 'Victor', 'Keo', 'Pa Ty', 'Mak Thy', 'Pa Nith', 'Mak Lux']
export const validGroup = value => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 40 && !/[\u0000-\u001f\u007f]/.test(value)
export const normalizeInvitation = item => ({ ...item, name: normalizeKhmerName(item.name), giftProcession: item.giftProcession !== false, group: item.group || 'Unassigned' })

// Pure validation shared with Excel preview; never silently guess malformed yes/no values.
export function parseGuestRows(rows) {
  if (!rows.length) throw new Error('The worksheet is empty.')
  const headers = rows[0].map(x => String(x ?? '').trim().toLowerCase().replace(/[ _-]+/g, ''))
  const nameCol = headers.findIndex(x => ['name', 'guestname'].includes(x))
  const giftCol = headers.findIndex(x => ['giftprocession', 'procession'].includes(x))
  const groupCol = headers.findIndex(x => ['group', 'owner', 'belongsto'].includes(x))
  if (nameCol < 0) throw new Error('The first row must contain a Guest Name column.')
  const result = []
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].every(x => x == null || String(x).trim() === '')) continue
    const name = normalizeKhmerName(String(rows[i][nameCol] ?? '').trim())
    const group = String(rows[i][groupCol] ?? '').trim() || 'Unassigned'
    const gift = String(rows[i][giftCol] ?? '').trim().toLowerCase()
    if (!name || name.length > 60 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error(`Row ${i + 1}: guest name must be 1–60 characters.`)
    if (!validGroup(group)) throw new Error(`Row ${i + 1}: group must be 1–40 characters.`)
    if (!['', 'yes', 'no', 'true', 'false', '1', '0'].includes(gift)) throw new Error(`Row ${i + 1}: Gift Procession must be Yes or No.`)
    result.push({ name, group, giftProcession: ['yes', 'true', '1'].includes(gift) })
  }
  if (!result.length || result.length > 1000) throw new Error('Upload between 1 and 1,000 guests per worksheet.')
  return result
}
