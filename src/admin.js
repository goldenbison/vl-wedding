import { DEFAULT_GROUPS, normalizeInvitation } from './modules/invitation-fields.js'
const $ = selector => document.querySelector(selector)
let password = ''
let items = []
let groups = [...DEFAULT_GROUPS]
let visibleLimit = 50
function groupOptions(select, all = false) {
  const previous = select.value
  select.replaceChildren(...(all ? [new Option('All groups', '')] : []), ...groups.map(g => new Option(g, g)))
  select.value = [...select.options].some(o => o.value === previous) ? previous : all ? '' : 'Unassigned'
}
function renderGroups() { groupOptions($('#group')); groupOptions($('#group-filter'), true) }
function remember(item) {
  if (!items.some(x => x.id === item.id)) items.unshift(normalizeInvitation(item))
  groups = [...new Set([...groups, item.group || 'Unassigned'])]
}
const linkFor = id => `${location.origin}/i/${id}`
const status = message => { $('#status').textContent = message }
async function api(method = 'GET', data, id) {
  const response = await fetch(`/api/invitations${id === 'session' ? '?session' : id ? `?id=${encodeURIComponent(id)}` : ''}`, { method, credentials: 'same-origin', headers: { ...(password ? { Authorization: `Bearer ${password}` } : {}), 'Content-Type': 'application/json' }, ...(data ? { body: JSON.stringify(data) } : {}) })
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The link service needs Netlify Functions. Deploy to Netlify or use netlify dev for local testing.')
  const result = await response.json()
  if (!response.ok) { const error = new Error(result.error || 'Could not load invitations.'); error.status = response.status; throw error }
  return result
}
async function copy(url) {
  try { await navigator.clipboard.writeText(url); status('Link copied. Ready to paste into Messenger or Telegram.') }
  catch { status(`Copy this link: ${url}`) }
}
function render() {
  const query = $('#search').value.trim().toLocaleLowerCase()
  const filtered = items.filter(item => item.name.toLocaleLowerCase().includes(query) && (!$('#group-filter').value || item.group === $('#group-filter').value))
  $('#links').replaceChildren()
  $('#count').textContent = `${filtered.length} of ${items.length} invitations · showing ${Math.min(visibleLimit, filtered.length)}`
  $('#show-more').hidden = filtered.length <= visibleLimit
  for (const item of filtered.slice(0, visibleLimit)) {
    const row = document.createElement('li')
    const info = document.createElement('div')
    const name = document.createElement('strong')
    name.textContent = item.name
    const a = document.createElement('a')
    a.href = linkFor(item.id); a.textContent = a.href; a.target = '_blank'; a.rel = 'noopener'
    const button = document.createElement('button')
    button.type = 'button'; button.textContent = 'Copy'; button.className = 'quiet'
    button.addEventListener('click', () => copy(a.href))
    button.disabled = Boolean(item.disabled)
    const badge = document.createElement('span')
    badge.className = `link-state${item.disabled ? ' disabled' : ''}`
    badge.textContent = item.disabled ? 'Disabled' : 'Active'
    const actions = document.createElement('div')
    actions.className = 'link-actions'
    const toggle = document.createElement('button')
    toggle.type = 'button'; toggle.className = 'quiet'; toggle.textContent = item.disabled ? 'Enable' : 'Disable'
    const remove = document.createElement('button')
    remove.type = 'button'; remove.className = 'quiet danger'; remove.textContent = 'Delete'
    async function change(method) {
      if (method === 'DELETE' && !confirm(`Permanently delete the invitation for ${item.name}? This link will stop working and cannot be restored. Use Disable if you may want to enable it again.`)) return
      actions.querySelectorAll('button').forEach(b => { b.disabled = true })
      try {
        const updated = await api(method, method === 'PATCH' ? { disabled: !item.disabled } : undefined, item.id)
        items = method === 'DELETE' ? items.filter(x => x.id !== item.id) : items.map(x => x.id === item.id ? updated : x)
        if ($('#result-url').value === linkFor(item.id)) $('#result').hidden = true
        render()
        status(method === 'DELETE' ? 'Invitation permanently deleted.' : updated.disabled ? 'Invitation disabled. You can enable it again at any time.' : 'Invitation enabled. The same link works again.')
      } catch (error) { status(error.message); render() }
    }
    toggle.addEventListener('click', () => change('PATCH'))
    remove.addEventListener('click', () => change('DELETE'))
    actions.append(button, toggle, remove)
    const settings = document.createElement('div')
    settings.className = 'guest-settings'
    const groupLabel = document.createElement('label'); groupLabel.textContent = 'Belongs to'
    const owner = document.createElement('select'); groupOptions(owner); owner.value = item.group
    groupLabel.append(owner)
    const giftLabel = document.createElement('label'); giftLabel.textContent = 'Gift procession'
    const gift = document.createElement('select'); gift.append(new Option('No', 'no'), new Option('Yes', 'yes')); gift.value = item.giftProcession ? 'yes' : 'no'
    giftLabel.append(gift)
    const save = document.createElement('button'); save.type = 'button'; save.className = 'quiet'; save.textContent = 'Save details'
    save.addEventListener('click', async () => {
      save.disabled = true
      try {
        const updated = await api('PATCH', { group: owner.value, giftProcession: gift.value === 'yes' }, item.id)
        items = items.map(x => x.id === item.id ? updated : x); render(); status('Guest details saved. The existing link uses the new settings.')
      } catch (error) { status(error.message); save.disabled = false }
    })
    settings.append(groupLabel, giftLabel, save)
    info.append(name, badge, a, settings); row.append(info, actions); $('#links').append(row)
  }
}
async function refresh() { const data = await api(); items = data.items.map(normalizeInvitation); groups = data.groups || [...DEFAULT_GROUPS]; renderGroups(); render() }
$('#login').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true; status('Signing in…')
  password = $('#password').value
  try { await api('POST', undefined, 'session'); password = ''; await refresh(); $('#login-panel').hidden = true; $('#workspace').hidden = false; $('#password').value = ''; status(''); $('#name').focus() }
  catch (error) { password = ''; status(error.message) }
  finally { password = ''; $('#password').value = ''; button.disabled = false }
})
$('#create').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true; status('Creating invitation…')
  try {
    const item = await api('POST', { name: $('#name').value, giftProcession: $('#gift').value === 'yes', group: $('#group').value })
    remember(item); render()
    $('#result-name').textContent = item.name; $('#result-url').value = linkFor(item.id); $('#open-result').href = linkFor(item.id)
    $('#result').hidden = false; $('#name').value = ''; status('Invitation saved. This link is ready to send.')
  } catch (error) { status(error.message) }
  finally { button.disabled = false }
})
$('#copy-result').addEventListener('click', () => copy($('#result-url').value))
$('#search').addEventListener('input', render)
$('#group-filter').addEventListener('change', () => { visibleLimit = 50; render() })
$('#show-more').addEventListener('click', () => { visibleLimit += 50; render() })
$('#add-group').addEventListener('submit', async event => {
  event.preventDefault(); event.submitter.disabled = true
  try { const result = await api('POST', { action: 'addGroup', group: $('#new-group').value }); groups = [...new Set([...groups, result.group])]; renderGroups(); render(); $('#new-group').value = ''; status('Group added.') }
  catch (error) { status(error.message) }
  finally { event.submitter.disabled = false }
})
let excelModule
async function excel() { return excelModule ||= import('./modules/admin-import.js').then(({ initImport }) => initImport({ api, status, onItem: remember, onComplete: () => { renderGroups(); render() }, getItems: () => items })) }
$('#excel-file').addEventListener('change', async () => { try { (await excel()).load($('#excel-file').files[0]) } catch (error) { status(error.message) } })
$('#template').addEventListener('click', async () => { try { await (await excel()).template() } catch (error) { status(error.message) } })
renderGroups()
$('#refresh').addEventListener('click', async () => { try { await refresh(); status('Invitations refreshed.') } catch (error) { status(error.message) } })
$('#logout').addEventListener('click', async () => {
  $('#logout').disabled = true
  try { await api('DELETE', undefined, 'session') }
  catch (error) { status(`Could not sign out: ${error.message}`); return }
  finally { $('#logout').disabled = false }
  if (excelModule) excelModule.then(module => module.reset())
  groups = [...DEFAULT_GROUPS]; renderGroups()
  password = ''; items = []; $('#links').replaceChildren(); $('#result').hidden = true; $('#result-url').value = ''; $('#result-name').textContent = ''; $('#open-result').removeAttribute('href'); $('#name').value = ''
  $('#workspace').hidden = true; $('#login-panel').hidden = false; status('Signed out.'); $('#password').focus()
})

// The browser sends the HttpOnly session cookie; no password is stored in JS storage.
async function restoreSession() {
  const button = $('#login button'); button.disabled = true
  status('Checking your session…')
  try {
    await refresh(); $('#login-panel').hidden = true; $('#workspace').hidden = false; status('')
  } catch (error) { status(error.status === 401 ? '' : error.message) }
  finally { button.disabled = false }
}
restoreSession()
