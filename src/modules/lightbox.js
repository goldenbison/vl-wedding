// Fullscreen lightbox for gallery images & videos.
import { $, esc, icon } from './dom.js'

let items = []
let index = 0
let lastFocus = null

function render() {
  const lb = $('#lightbox')
  const item = items[index]
  const media =
    item.type === 'video'
      ? `<video src="${esc(item.src)}" controls autoplay playsinline></video>`
      : `<img src="${esc(item.src)}" alt="${esc(item.caption) || ''}" />`
  $('.lb-media', lb).innerHTML = media
  $('.lb-caption', lb).textContent = item.caption || ''
  $('.lb-counter', lb).textContent = `${index + 1} / ${items.length}`
}

function step(dir) {
  index = (index + dir + items.length) % items.length
  render()
}

function close() {
  const lb = $('#lightbox')
  lb.classList.remove('lb-in')
  setTimeout(() => {
    lb.hidden = true
    $('.lb-media', lb).innerHTML = ''
  }, 300)
  document.removeEventListener('keydown', onKey)
  if (lastFocus) lastFocus.focus()
}

function onKey(e) {
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowLeft') step(-1)
  if (e.key === 'ArrowRight') step(1)
}

export function openLightbox(list, i) {
  items = list
  index = i
  lastFocus = document.activeElement
  const lb = $('#lightbox')

  if (!lb.dataset.ready) {
    lb.dataset.ready = '1'
    lb.innerHTML = `
      <div class="lb-counter"></div>
      <div>
        <div class="lb-media"></div>
        <div class="lb-caption"></div>
      </div>
      <button class="lb-btn lb-close" aria-label="បិទ">${icon('close')}</button>
      <button class="lb-btn lb-prev" aria-label="មុន">${icon('left')}</button>
      <button class="lb-btn lb-next" aria-label="បន្ទាប់">${icon('right')}</button>`
    $('.lb-close', lb).addEventListener('click', close)
    $('.lb-prev', lb).addEventListener('click', () => step(-1))
    $('.lb-next', lb).addEventListener('click', () => step(1))
    lb.addEventListener('click', (e) => {
      if (e.target === lb) close()
    })
    // basic swipe
    let x0 = null
    lb.addEventListener('pointerdown', (e) => (x0 = e.clientX))
    lb.addEventListener('pointerup', (e) => {
      if (x0 == null) return
      const dx = e.clientX - x0
      if (Math.abs(dx) > 48) step(dx > 0 ? -1 : 1)
      x0 = null
    })
  }

  render()
  lb.hidden = false
  requestAnimationFrame(() => lb.classList.add('lb-in'))
  document.addEventListener('keydown', onKey)
  $('.lb-close', lb).focus()
}
