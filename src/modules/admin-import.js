import readXlsxFile from 'read-excel-file/browser'
import { parseGuestRows } from './invitation-fields.js'

export function initImport({ api, status, onItem, onComplete, getItems }) {
  const $ = selector => document.querySelector(selector)
  let sheets = [], entries = [], running = false
  const id = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(9)))).replaceAll('+', '-').replaceAll('/', '_')
  function review() {
    $('#import-review').hidden = true
    try {
      entries = parseGuestRows(sheets[Number($('#sheet').value)].data).map(item => ({ ...item, requestId: id(), done: false }))
      const seen = new Set(getItems().map(x => `${x.name}\n${x.group}`))
      let duplicates = 0
      for (const item of entries) { const key = `${item.name}\n${item.group}`; if (seen.has(key)) duplicates++; seen.add(key) }
      $('#import-summary').textContent = `${entries.length} guests · ${entries.filter(x => x.giftProcession).length} invited to gift procession${duplicates ? ` · Warning: ${duplicates} matching name/group entries already exist or repeat in this sheet. They will receive separate links.` : ''}`
      $('#import-rows').replaceChildren()
      for (const entry of entries.slice(0, 100)) {
        const tr = document.createElement('tr')
        for (const value of [entry.name, entry.giftProcession ? 'Yes' : 'No', entry.group]) { const td = document.createElement('td'); td.textContent = value; tr.append(td) }
        $('#import-rows').append(tr)
      }
      $('#import-detail').textContent = entries.length > 100 ? 'Showing the first 100 rows. All validated rows will be imported.' : 'Check these details before creating links.'
      $('#import-confirm').disabled = false; $('#import-confirm').textContent = 'Create invitation links'; $('#import-review').hidden = false
    } catch (error) { entries = []; status(error.message) }
  }
  $('#sheet').addEventListener('change', review)
  $('#import-confirm').addEventListener('click', async () => {
    if (running) return
    running = true
    const locked = ['#excel-file', '#sheet', '#import-confirm', '#logout', '#refresh']
    locked.forEach(s => { $(s).disabled = true })
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    let cursor = 0, errors = []
    const pending = entries.filter(e => !e.done)
    await Promise.all(Array.from({ length: Math.min(4, pending.length) }, async () => {
      while (cursor < pending.length) {
        const entry = pending[cursor++]
        try {
          const { done, ...payload } = entry
          const saved = await api('POST', payload)
          entry.done = true; onItem(saved)
        } catch (error) { errors.push(`${entry.name}: ${error.message}`) }
        status(`Importing: ${entries.filter(e => e.done).length}/${entries.length} saved.`)
      }
    }))
    window.removeEventListener('beforeunload', warn)
    running = false; locked.forEach(s => { $(s).disabled = false }); onComplete()
    $('#import-confirm').disabled = !errors.length
    $('#import-confirm').textContent = errors.length ? 'Retry unsaved rows' : 'Import complete'
    $('#import-detail').textContent = errors.length ? errors.slice(0, 5).join(' · ') : 'All links are saved in the guest list below.'
    status(`${entries.filter(e => e.done).length} invitations saved.${errors.length ? ` ${errors.length} failed. Retry here without re-uploading; saved rows will not be duplicated.` : ''}`)
  })
  return {
    reset() {
      entries = []; sheets = []
      $('#excel-file').value = ''; $('#import-review').hidden = true
      $('#import-rows').replaceChildren(); $('#sheet').replaceChildren()
      $('#sheet').hidden = true; $('#sheet-label').hidden = true
    },
    async load(file) {
      if (running || !file) return
      $('#import-review').hidden = true; entries = []; sheets = []
      try {
        if (!/\.xlsx$/i.test(file.name) || file.size > 5 * 1024 * 1024) throw new Error('Choose an .xlsx workbook smaller than 5 MB.')
        status('Reading workbook…')
        sheets = await readXlsxFile(file)
        $('#sheet').replaceChildren(...sheets.map((s, i) => new Option(s.sheet, String(i))))
        $('#sheet').hidden = false; $('#sheet-label').hidden = false
        status('Workbook ready. Review the selected sheet.'); review()
      } catch (error) { status(error.message); $('#sheet').hidden = true; $('#sheet-label').hidden = true }
    },
    async template() {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const data = [
        ['Guest Name', 'Gift Procession', 'Group'],
        ['Example Guest — replace this row', 'No', 'Unassigned'],
        ['លោក និងលោកស្រី សុខា', 'Yes', 'Victor'],
      ].map(row => row.map(value => ({ type: String, value })))
      await writeXlsxFile(data, { columns: [{ width: 42 }, { width: 22 }, { width: 22 }] }).toFile('guest-import-template.xlsx')
    },
  }
}
