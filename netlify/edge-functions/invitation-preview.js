// Serve path-specific metadata before JavaScript runs, for people and crawlers.
// Keep guest names private: preview copy and artwork remain generic.
export default async function invitationPreview(request, context) {
  const path = new URL(request.url).pathname
  const match = path.match(/^\/i\/([A-Za-z0-9_-]{12})\/?$/)
  if (!match || !['GET', 'HEAD'].includes(request.method)) return context.next()
  // Meta sends Range requests. Partial HTML used to skip the transformation,
  // leaking the homepage canonical. This small document must be fetched whole.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete('range')
  requestHeaders.delete('if-range')
  const response = await context.next(new Request(request, { headers: requestHeaders }))
  if (request.method === 'HEAD' || response.status !== 200 || !response.headers.get('content-type')?.includes('text/html')) return response
  const canonical = `https://victorlakna.com/i/${match[1]}`
  const html = (await response.text())
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?\s*>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?\s*>/, `<meta property="og:url" content="${canonical}" />`)
  const headers = new Headers(response.headers)
  for (const name of ['content-length', 'content-encoding', 'etag', 'content-range', 'accept-ranges']) headers.delete(name)
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  return new Response(html, { status: response.status, headers })
}

export const config = { path: '/i/*' }
