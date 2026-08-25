// "Add to calendar" — Google Calendar link.
import { couple, event } from '../config.js'

const toUTC = (iso) =>
  new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const TITLE = `Wedding of ${couple.groom.en} & ${couple.bride.en}`
const LOCATION = event.venueEn
const DETAILS = `${event.dayEn} ${event.timeEn} — ${event.venueEn}`

export function gcalHref() {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: TITLE,
    dates: `${toUTC(event.dateISO)}/${toUTC(event.endISO)}`,
    location: LOCATION,
    details: DETAILS,
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}
