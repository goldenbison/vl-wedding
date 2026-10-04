import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import preview from '../netlify/edge-functions/invitation-preview.js'

test('guest HTML identifies its own URL for all crawlers without exposing guest data', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  for (const agent of ['facebookexternalhit/1.1', 'Facebot', 'TelegramBot', 'Mozilla/5.0']) {
    for (const suffix of ['', '/', '?fbclid=test']) {
      const response = await preview(new Request(`https://victorlakna.com/i/Fcly_VYoKEby${suffix}`, { headers: { 'user-agent': agent } }), {
        next: async () => new Response(html, { headers: { 'content-type': 'text/html', etag: 'old', 'content-length': '5' } }),
      })
      const result = await response.text()
      assert.ok(result.includes('<meta property="og:url" content="https://victorlakna.com/i/Fcly_VYoKEby" />'))
      assert.ok(result.includes('<link rel="canonical" href="https://victorlakna.com/i/Fcly_VYoKEby" />'))
      assert.ok(result.includes('wedding-preview-v1.jpg'))
      assert.ok(result.includes('Open your invitation 💌'))
      assert.equal(response.headers.get('etag'), null)
      assert.equal(response.headers.get('content-length'), null)
    }
  }
})

test('unrelated paths and failed responses pass through unchanged', async () => {
  for (const path of ['/', '/admin', '/i/invalid']) {
    const original = new Response('original')
    assert.equal(await preview(new Request(`https://example.com${path}`), { next: async () => original }), original)
  }
  const missing = new Response('missing', { status: 404 })
  assert.equal(await preview(new Request('https://example.com/i/Fcly_VYoKEby'), { next: async () => missing }), missing)
})

test('Meta range requests fetch a full document before metadata rewriting', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  const response = await preview(new Request('https://victorlakna.com/i/iTCCpRjsYt_T', {
    headers: { Range: 'bytes=0-524288', 'If-Range': 'old-etag', 'User-Agent': 'facebookexternalhit/1.1' },
  }), {
    next: async request => {
      assert.equal(request.headers.get('range'), null)
      assert.equal(request.headers.get('if-range'), null)
      assert.equal(request.headers.get('user-agent'), 'facebookexternalhit/1.1')
      return new Response(html, { headers: { 'content-type': 'text/html', 'accept-ranges': 'bytes' } })
    },
  })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('accept-ranges'), null)
  assert.ok((await response.text()).includes('<meta property="og:url" content="https://victorlakna.com/i/iTCCpRjsYt_T" />'))
})
