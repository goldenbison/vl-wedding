const $ = selector => document.querySelector(selector)
let password = ''
let items = []
const linkFor = id => `${location.origin}/i/${id}`
const status = message => { $('#status').textContent = message }
async function api(method = 'GET', data) {
  const response = await fetch('/api/invitations', { method, headers: { Authorization: `Bearer ${password}`, 'Content-Type': 'application/json' }, ...(data ? { body: JSON.stringify(data) } : {}) })
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
    info.append(name, a); row.append(info, button); $('#links').append(row)
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
