const $ = selector => document.querySelector(selector)
let password = ''
let items = []
const linkFor = id => `${location.origin}/i/${id}`
const status = message => { $('#status').textContent = message }
async function api(method = 'GET', data, id) {
  const response = await fetch(`/api/invitations${id ? `?id=${encodeURIComponent(id)}` : ''}`, { method, headers: { Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' }, ...(data ? { body: JSON.stringify(data) } : {}) })
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The link service needs Netlify Functions. Deploy to Netlify or use netlify dev for local testing.')
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Could not load invitations.')
  return result
}
async function copy(url) {
  try { await navigator.clipboard.writeText(url); status('Link copied. Ready to paste into Messenger or Telegram.') }
  catch { status(`Copy this link: ${url}`) }
}
function render() {
  const query = $('#search').value.trim().toLocaleLowerCase()
  const filtered = items.filter(item => item.name.toLocaleLowerCase().includes(query))
  $('#links').replaceChildren()
  $('#count').textContent = `${filtered.length} of ${items.length} invitations`
  for (const item of filtered) {
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
    info.append(name, badge, a); row.append(info, actions); $('#links').append(row)
  }
}
async function refresh() { items = (await api()).items; render() }
$('#login').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true; status('Signing in…')
  password = $('#password').value
  try { await refresh(); $('#login-panel').hidden = true; $('#workspace').hidden = false; $('#password').value = ''; status(''); $('#name').focus() }
  catch (error) { password = ''; status(error.message) }
  finally { button.disabled = false }
})
$('#create').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true; status('Creating invitation…')
  try {
    const item = await api('POST', { name: $('#name').value })
    items.unshift(item); render()
    $('#result-name').textContent = item.name; $('#result-url').value = linkFor(item.id); $('#open-result').href = linkFor(item.id)
    $('#result').hidden = false; $('#name').value = ''; status('Invitation saved. This link is ready to send.')
  } catch (error) { status(error.message) }
  finally { button.disabled = false }
})
$('#copy-result').addEventListener('click', () => copy($('#result-url').value))
$('#search').addEventListener('input', render)
$('#refresh').addEventListener('click', async () => { try { await refresh(); status('Invitations refreshed.') } catch (error) { status(error.message) } })
$('#logout').addEventListener('click', () => {
  password = ''; items = []; $('#links').replaceChildren(); $('#result').hidden = true; $('#result-url').value = ''; $('#result-name').textContent = ''; $('#open-result').removeAttribute('href'); $('#name').value = ''
  $('#workspace').hidden = true; $('#login-panel').hidden = false; status('Signed out.'); $('#password').focus()
})
