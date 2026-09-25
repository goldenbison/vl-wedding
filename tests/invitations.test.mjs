import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHandler } from '../netlify/functions/invitations.mjs'

test('private creation/listing and public cross-session resolution', async () => {
  const records = new Map()
  const store = {
    get: async key => records.get(key) || null,
    getWithMetadata: async key => records.has(key) ? { data: records.get(key), etag: 'test-etag' } : null,
    setJSON: async (key, item, options = {}) => { if (options.onlyIfNew && records.has(key)) return { modified: false }; if (options.onlyIfMatch && !records.has(key)) return { modified: false }; records.set(key, item); return { modified: true } },
    delete: async key => { records.delete(key) },
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
    const query = `?id=${created.id}`
    assert.equal((await handler(request('PATCH', { disabled: true }, false, query))).status, 401)
    assert.equal((await handler(request('DELETE', undefined, false, query))).status, 401)
    assert.equal((await handler(request('PATCH', { disabled: 'yes' }, true, query))).status, 400)
    assert.equal((await handler(request('PATCH', { disabled: true }, true, query))).status, 200)
    const blocked = await handler(request('GET', undefined, false, query))
    assert.equal(blocked.status, 410)
    assert.equal((await blocked.json()).name, undefined)
    const disabledList = await (await handler(request('GET', undefined, true))).json()
    assert.equal(disabledList.items[0].disabled, true)
    assert.equal((await handler(request('PATCH', { disabled: false }, true, query))).status, 200)
    assert.equal((await handler(request('GET', undefined, false, query))).status, 200)
    assert.equal((await handler(request('DELETE', undefined, true, query))).status, 200)
    assert.equal((await handler(request('GET', undefined, false, query))).status, 404)
    assert.equal((await handler(request('PATCH', { disabled: false }, true, query))).status, 404)
    assert.equal((await (await handler(request('GET', undefined, true))).json()).items.length, 0)
    delete process.env.ADMIN_PASSWORD
    assert.equal((await handler(request('POST', { name: 'Guest' }, true))).status, 503)
  } finally { if (previous === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = previous }
})
