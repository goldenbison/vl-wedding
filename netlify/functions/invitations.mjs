import { getStore } from '@netlify/blobs'
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto'
import { DEFAULT_GROUPS, validGroup, normalizeInvitation } from '../../src/modules/invitation-fields.js'

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
      if (item?.disabled) return json({ error: 'This invitation is currently unavailable. Please contact the couple.' }, 410)
      return item ? json({ name: item.name, giftProcession: item.giftProcession !== false }) : json({ error: 'Invitation not found.' }, 404)
    }
    const password = process.env.ADMIN_PASSWORD
    if (!password) return json({ error: 'Add ADMIN_PASSWORD in Netlify environment variables, then redeploy to enable the admin page.' }, 503)
    const supplied = request.headers.get('authorization') || ''
    if (!timingSafeEqual(hash(supplied), hash(`Bearer ${password}`))) return json({ error: 'Incorrect admin password.' }, 401)
    const store = openStore()
    if (request.method === 'GET') {
      const { blobs } = await store.list()
      const guestBlobs = blobs.filter(({ key }) => /^[A-Za-z0-9_-]{12}$/.test(key))
      const items = []
      // Bound parallel reads even for a large guest list.
      for (let start = 0; start < guestBlobs.length; start += 20) {
        const batch = await Promise.all(guestBlobs.slice(start, start + 20).map(async ({ key }) => {
          const item = await store.get(key, { type: 'json' })
          return item ? normalizeInvitation({ id: key, ...item }) : null
        }))
        items.push(...batch.filter(Boolean))
      }
      const groups = [...new Set([...DEFAULT_GROUPS, ...blobs.filter(b => b.key.startsWith('groups/')).map(b => decodeURIComponent(b.key.slice(7))), ...items.map(i => i.group)])]
      return json({ items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), groups })
    }
    if (request.method === 'DELETE') {
      if (!id || !/^[A-Za-z0-9_-]{12}$/.test(id)) return json({ error: 'Invalid invitation link.' }, 400)
      await store.delete(id)
      return json({ deleted: true, id })
    }
    if (!['POST', 'PATCH'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405)
    const raw = await request.text()
    if (raw.length > 2048) return json({ error: 'Request is too large.' }, 413)
    let body
    try { body = JSON.parse(raw) } catch { return json({ error: 'Invalid request.' }, 400) }
    if (request.method === 'POST' && body?.action === 'addGroup') {
      if (!validGroup(body.group)) return json({ error: 'Enter a group name of 1–40 characters.' }, 400)
      await store.setJSON(`groups/${encodeURIComponent(body.group.trim())}`, {}, { onlyIfNew: true })
      return json({ group: body.group.trim() }, 201)
    }
    if (body?.giftProcession !== undefined && typeof body.giftProcession !== 'boolean') return json({ error: 'Gift procession must be Yes or No.' }, 400)
    if (body?.group !== undefined && !validGroup(body.group)) return json({ error: 'Invalid group name.' }, 400)
    if (request.method === 'PATCH') {
      if (!id || !/^[A-Za-z0-9_-]{12}$/.test(id) || !body || !Object.keys(body).length || Object.keys(body).some(k => !['disabled', 'giftProcession', 'group'].includes(k)) || (body.disabled !== undefined && typeof body.disabled !== 'boolean')) return json({ error: 'Invalid invitation update.' }, 400)
      const existing = await store.getWithMetadata(id, { type: 'json' })
      if (!existing) return json({ error: 'Invitation not found.' }, 404)
      const item = normalizeInvitation({ ...existing.data, ...body, ...(body.group ? { group: body.group.trim() } : {}) })
      const result = await store.setJSON(id, item, { onlyIfMatch: existing.etag })
      if (!result.modified) return json({ error: 'This invitation changed. Refresh the list and try again.' }, 409)
      return json({ id, ...item })
    }
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name || name.length > 60 || /[\u0000-\u001f\u007f]/.test(name)) return json({ error: 'Enter a guest name of 1–60 characters.' }, 400)
    const item = { name, giftProcession: body.giftProcession === true, group: body.group?.trim() || 'Unassigned', createdAt: new Date().toISOString() }
    // Stable per-row ID makes retries after interrupted Excel imports safe.
    if (body.requestId !== undefined) {
      if (!/^[A-Za-z0-9_-]{12}$/.test(body.requestId)) return json({ error: 'Invalid request ID.' }, 400)
      const result = await store.setJSON(body.requestId, item, { onlyIfNew: true })
      if (result.modified) return json({ id: body.requestId, ...item }, 201)
      const existing = await store.get(body.requestId, { type: 'json' })
      if (existing && existing.name === name && existing.group === item.group && existing.giftProcession === item.giftProcession) return json({ id: body.requestId, ...existing })
      return json({ error: 'This import row conflicts with an existing invitation.' }, 409)
    }
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
