import { createHmac, timingSafeEqual } from 'node:crypto'

const cookieName = 'wedding_admin'
const lifetime = 8 * 60 * 60
const signature = (value, secret) => createHmac('sha256', secret).update(`admin-session:${value}`).digest('base64url')
export function sessionCookie(secret, now = Date.now()) {
  const expires = String(Math.floor(now / 1000) + lifetime)
  return `${cookieName}=${expires}.${signature(expires, secret)}; HttpOnly; Secure; SameSite=Strict; Path=/api/invitations; Max-Age=${lifetime}`
}
export function clearSessionCookie() {
  return `${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/api/invitations; Max-Age=0`
}
export function validSession(request, secret, now = Date.now()) {
  const token = (request.headers.get('cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
  if (!token) return false
  const [expires, signed, extra] = token.split('.')
  if (extra || !/^\d{10}$/.test(expires) || !signed || Number(expires) <= Math.floor(now / 1000)) return false
  const expected = Buffer.from(signature(expires, secret))
  const actual = Buffer.from(signed)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
