import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHandler } from '../netlify/functions/invitations.mjs'

test('private creation/listing and public cross-session resolution', async () => {
  const records = new Map()
  const store = {
    get: async key => records.get(key) || null,
    setJSON: async (key, item) => { if (records.has(key)) return { modified: false }; records.set(key, item); return { modified: true } },
    list: async () => ({ blobs: [...records.keys()].map(key => ({ key })) }),
  }
  const handler = createHandler(() => store)
  const previous = process.env.ADMIN_PASSWORD
  process.env.ADMIN_PASSWORD = 'test-only-long-password'
  const request = (method, body, authorized = false, query = '') => new Request(`https://example.com/api/invitations${query}`, {
    method, headers: authorized ? { Authorization: 'Bearer test-only-long-password' } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  try {
    assert.equal((await handler(request('GET'))).status, 401)
    assert.equal((await handler(request('POST', { name: 'Guest' }))).status, 401)
    for (const name of ['', 'x'.repeat(61), '\u0000']) assert.equal((await handler(request('POST', { name }, true))).status, 400)
    const response = await handler(request('POST', { name: 'លោក និងលោកស្រី សុខា' }, true))
    assert.equal(response.status, 201)
    const created = await response.json()
    assert.match(created.id, /^[A-Za-z0-9_-]{12}$/)
    // A fresh handler represents a different visitor/function invocation.
    const guestResponse = await createHandler(() => store)(request('GET', undefined, false, `?id=${created.id}`))
    assert.deepEqual(await guestResponse.json(), { name: 'លោក និងលោកស្រី សុខា' })
    assert.equal((await handler(request('GET', undefined, false, '?id=missing'))).status, 404)
    assert.equal((await handler(request('GET', undefined, false, '?id=abcdefghijkl'))).status, 404)
    const list = await (await handler(request('GET', undefined, true))).json()
    assert.equal(list.items.length, 1)
    delete process.env.ADMIN_PASSWORD
    assert.equal((await handler(request('POST', { name: 'Guest' }, true))).status, 503)
  } finally { if (previous === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = previous }
})
