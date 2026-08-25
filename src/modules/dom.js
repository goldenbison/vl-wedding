// Shared DOM helpers, small ornaments and the icon set.

export const $ = (sel, root = document) => root.querySelector(sel)
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]

export function esc(s = '') {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function el(tag, cls, html) {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (html != null) n.innerHTML = html
  return n
}

// small flourish divider used under titles
export function divider(cls = 'divider') {
  return `
  <svg class="${cls}" viewBox="0 0 220 16" aria-hidden="true" fill="none" stroke="currentColor">
    <path d="M6 8 H84" stroke-width="1"/>
    <path d="M136 8 H214" stroke-width="1"/>
    <path d="M110 2 l6 6 -6 6 -6 -6 Z" stroke-width="1.2"/>
    <circle cx="94" cy="8" r="1.6" fill="currentColor" stroke="none"/>
    <circle cx="126" cy="8" r="1.6" fill="currentColor" stroke="none"/>
    <path d="M88 8 q-6 -7 -14 0 q8 7 14 0 Z" stroke-width="1"/>
    <path d="M132 8 q6 -7 14 0 q-8 7 -14 0 Z" stroke-width="1"/>
  </svg>`
}

export function sectionTitle(kh, en) {
  return `
  <div class="sec-head reveal">
    <h2 class="sec-title">${esc(kh)}</h2>
    ${en ? `<div class="sec-sub">${esc(en)}</div>` : ''}
    <div class="sec-divider">${divider()}</div>
  </div>`
}

// simple cream card with a double gold frame (matches the printed letter card)
export function paperCard(innerHTML, extraClass = '') {
  return `
  <div class="paper reveal ${extraClass}">
    <div class="paper-inner">${innerHTML}</div>
  </div>`
}

// an artwork panel presented as a physical card (display only, not clickable)
export function artCard({ src, alt }, extraClass = '') {
  return `
  <figure class="art-card reveal ${extraClass}">
    <img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" draggable="false" />
  </figure>`
}

// ---------------------------------------------------------------------------
// Icon set (24×24, stroked in currentColor)
// ---------------------------------------------------------------------------
const paths = {
  pin:
    '<path d="M12 21c-4-4.4-6-7.7-6-10.4A6 6 0 0 1 18 10.6C18 13.3 16 16.6 12 21Z"/><circle cx="12" cy="10.4" r="2.2"/>',
  photo:
    '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m5.5 17 4.4-4.4 3 3 2.6-2.6 3 4"/>',
  dove:
    '<path d="M20.5 5.5c-4.6.2-7.5 1.8-9.3 4.6L9.5 8.4 4 9.7l4.3 2.5c-1 2.4-.8 4.8.4 7.3 4-.6 6.9-2 8.6-4.4 1.8-2.4 2.8-5.6 3.2-9.6Z"/><path d="M11.2 10.1C10 8.4 8.6 7.6 6.8 7.5"/>',
  wishlove:
    '<path d="M4 5h16a1.6 1.6 0 0 1 1.6 1.6v8.8A1.6 1.6 0 0 1 20 17h-8.4L7 20.6a.6.6 0 0 1-1-.46V17H4a1.6 1.6 0 0 1-1.6-1.6V6.6A1.6 1.6 0 0 1 4 5Z"/><path d="M12 13.9c-2.7-1.7-4-3.2-3.3-4.7.5-1 1.9-1.2 2.7-.4l.6.6.6-.6c.8-.8 2.2-.6 2.7.4.7 1.5-.6 3-3.3 4.7Z"/>',
  home:
    '<path d="m4 11 8-6.5L20 11"/><path d="M6.5 9.5V19h11V9.5"/><path d="M12 19v-4.5a1.6 1.6 0 0 0 0-3.2 1.6 1.6 0 0 0 0 3.2"/>',
  calendar:
    '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 10.5h16M8.5 4v3.6M15.5 4v3.6"/><path d="M12 17.4c-1.8-1.4-2.7-2.6-2-3.6.6-.8 1.6-.5 2 .3.4-.8 1.4-1.1 2-.3.7 1-.2 2.2-2 3.6Z"/>',
  send: '<path d="M4 11.5 20 4l-4.4 16-4.2-6.2Z"/><path d="M11.4 13.8 20 4"/>',
  note: '<path d="M9 17.5V6.8L19 5v10.7"/><circle cx="6.6" cy="17.6" r="2.4"/><circle cx="16.6" cy="15.8" r="2.4"/>',
  rings:
    '<circle cx="9.3" cy="13.2" r="5.4"/><circle cx="14.7" cy="13.2" r="5.4"/><path d="M12 5.4 10.2 3h3.6Z"/><path d="M12 2.2v0.5"/>',
  heartsend:
    '<path d="M14 18.4c-4.2-2.6-6.2-5.1-5.1-7.4.8-1.6 2.9-1.9 4.2-.6l.9.9.9-.9c1.3-1.3 3.4-1 4.2.6 1.1 2.3-.9 4.8-5.1 7.4Z"/><path d="M3.5 8h4.6M2.5 11.5h3.8M4.5 15h3"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  quote:
    '<path d="M6 15c-1.4-1-2-2.4-2-4 0-2.6 1.8-4.6 4.4-5l.6 1.6C7.4 8.2 6.6 9.2 6.5 10.4c.2-.1.5-.1.8-.1 1.5 0 2.6 1 2.6 2.4S8.8 15.2 7.3 15.2c-.5 0-.9-.1-1.3-.2Zm8 0c-1.4-1-2-2.4-2-4 0-2.6 1.8-4.6 4.4-5l.6 1.6c-1.6.6-2.4 1.6-2.5 2.8.2-.1.5-.1.8-.1 1.5 0 2.6 1 2.6 2.4s-1.1 2.5-2.6 2.5c-.5 0-.9-.1-1.3-.2Z"/>',
  play: '<path d="M8 5.5v13l11-6.5Z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  list: '<path d="M8 6.5h12M8 12h12M8 17.5h12"/><circle cx="4.4" cy="6.5" r="1.1"/><circle cx="4.4" cy="12" r="1.1"/><circle cx="4.4" cy="17.5" r="1.1"/>',
}

export function icon(name, cls = 'icon') {
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`
}

// ---------------------------------------------------------------------------
let toastTimer = null
export function toast(msg, isError = false) {
  const t = $('#toast')
  t.textContent = msg
  t.classList.toggle('toast-error', isError)
  t.hidden = false
  requestAnimationFrame(() => t.classList.add('toast-in'))
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    t.classList.remove('toast-in')
    setTimeout(() => (t.hidden = true), 350)
  }, 2800)
}

export function sprinkleStars(container, n = 14) {
  for (let i = 0; i < n; i++) {
    const s = el('span', 'star')
    s.style.setProperty('--x', `${Math.random() * 100}%`)
    s.style.setProperty('--y', `${Math.random() * 100}%`)
    s.style.setProperty('--d', `${(2.4 + Math.random() * 3.2).toFixed(2)}s`)
    s.style.setProperty('--dl', `${(Math.random() * 4).toFixed(2)}s`)
    s.style.setProperty('--s', (0.5 + Math.random() * 0.9).toFixed(2))
    container.appendChild(s)
  }
}
