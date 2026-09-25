import { getStore } from '@netlify/blobs'
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto'

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
})
const hash = value => createHash('sha256').update(value).digest()

export function createHandler(openStore = () => getStore({ name: 'invitations', consistency: 'strong' })) {
return async function handler(request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  try {
    // Public lookup reveals only the name belonging to this unguessable link.
    if (request.method === 'GET' && id) {
      if (!/^[A-Za-z0-9_-]{12}$/.test(id)) return json({ error: 'Invitation not found.' }, 404)
      const item = await openStore().get(id, { type: 'json' })
      return item ? json({ name: item.name }) : json({ error: 'Invitation not found.' }, 404)
    }
    const password = process.env.ADMIN_PASSWORD
    if (!password) return json({ error: 'Add ADMIN_PASSWORD in Netlify environment variables, then redeploy to enable the admin page.' }, 503)
    const supplied = request.headers.get('authorization') || ''
    if (!timingSafeEqual(hash(supplied), hash(`Bearer ${password}`))) return json({ error: 'Incorrect admin password.' }, 401)
    const store = openStore()
    if (request.method === 'GET') {
      const { blobs } = await store.list()
      const items = []
      // Bound parallel reads even for a large guest list.
      for (let start = 0; start < blobs.length; start += 20) {
        const batch = await Promise.all(blobs.slice(start, start + 20).map(async ({ key }) => ({ id: key, ...await store.get(key, { type: 'json' }) })))
        items.push(...batch)
      }
      return json({ items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) })
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
    const raw = await request.text()
    if (raw.length > 2048) return json({ error: 'Request is too large.' }, 413)
    let body
    try { body = JSON.parse(raw) } catch { return json({ error: 'Invalid request.' }, 400) }
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name || name.length > 60 || /[\u0000-\u001f\u007f]/.test(name)) return json({ error: 'Enter a guest name of 1–60 characters.' }, 400)
    const item = { name, createdAt: new Date().toISOString() }
    for (let attempt = 0; attempt < 5; attempt++) {
      const key = randomBytes(9).toString('base64url')
      const result = await store.setJSON(key, item, { onlyIfNew: true })
      if (result.modified) return json({ id: key, ...item }, 201)
    }
    return json({ error: 'Could not reserve a link. Please try again.' }, 503)
  } catch (error) {
    console.error('Invitation storage failed:', error.message)
    return json({ error: 'Invitation service is temporarily unavailable. Please try again.' }, 503)
  }
}
}

export default createHandler()

export const config = { path: '/api/invitations' }
