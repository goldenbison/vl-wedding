// Ambient layer: the golden oak painting anchors the left edge; authentic
// lobed oak leaves rustle on its canopy and fall from it across the page.
// Everything renders BEHIND the content — visible only in empty space.
import { $, el } from './dom.js'

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches
let started = false

// oak-leaf shapes + golds sampled from the painting
const DEFS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <linearGradient id="oakA" x1="0" y1="0" x2="1" y2="0.5">
      <stop offset="0" stop-color="#f4c94f"/>
      <stop offset="0.55" stop-color="#d89c2b"/>
      <stop offset="1" stop-color="#96691d"/>
    </linearGradient>
    <linearGradient id="oakB" x1="0" y1="0" x2="1" y2="0.5">
      <stop offset="0" stop-color="#cf9a2d"/>
      <stop offset="0.55" stop-color="#a4741f"/>
      <stop offset="1" stop-color="#6f4d19"/>
    </linearGradient>
    <!-- a true oak leaf: lobed edges, midrib, short stem (base at 0,0 → tip +x) -->
    <g id="oakleaf-a">
      <path fill="url(#oakA)" d="M0 0 Q 2.5 -5.5 6.5 -4.5 Q 7.5 -8.5 11.5 -6.5 Q 13.5 -10 17.5 -7.5 Q 20.5 -9.5 23.5 -6 Q 27.5 -6 29.5 -2.5 Q 31.5 -0.5 29.5 1 Q 30 4.5 26.5 5 Q 25 8.5 21 7 Q 18.5 10.5 14.5 8 Q 11 10.5 8 7.5 Q 4 8.5 2.5 5 Q 0.5 3.5 0 0 Z"/>
      <path d="M1.5 0.2 C 10 -1 19 -1.4 28.5 -1" stroke="#8a5f1c" stroke-width="0.9" fill="none" opacity="0.6"/>
      <path d="M-4.5 2.2 L0.5 0.2" stroke="#8a5f1c" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </g>
    <g id="oakleaf-b">
      <path fill="url(#oakB)" d="M0 0 Q 2.5 -5.5 6.5 -4.5 Q 7.5 -8.5 11.5 -6.5 Q 13.5 -10 17.5 -7.5 Q 20.5 -9.5 23.5 -6 Q 27.5 -6 29.5 -2.5 Q 31.5 -0.5 29.5 1 Q 30 4.5 26.5 5 Q 25 8.5 21 7 Q 18.5 10.5 14.5 8 Q 11 10.5 8 7.5 Q 4 8.5 2.5 5 Q 0.5 3.5 0 0 Z"/>
      <path d="M1.5 0.2 C 10 -1 19 -1.4 28.5 -1" stroke="#5c3f12" stroke-width="0.9" fill="none" opacity="0.6"/>
      <path d="M-4.5 2.2 L0.5 0.2" stroke="#5c3f12" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </g>
  </defs>
</svg>`

const rnd = (a, b) => a + Math.random() * (b - a)
const leafId = () => (Math.random() < 0.55 ? 'oakleaf-a' : 'oakleaf-b')

// wiggling leaves overlaid on the painted canopy [x%, y%] of the image
const CANOPY_SPOTS = [
  [14, 8], [30, 5], [47, 7], [63, 10], [78, 15], [90, 24],
  [22, 20], [40, 17], [57, 22], [72, 30], [86, 40], [33, 33],
  [50, 36], [66, 44], [12, 28], [25, 45],
]

export function startAmbient() {
  if (REDUCED || started) return
  started = true
  const layer = $('#ambient')

  // --- the oak painting + rustling overlay ---
  const rustle = CANOPY_SPOTS.map(([x, y]) => {
    const size = rnd(13, 22).toFixed(0)
    return `
    <span class="tl" style="left:${x}%;top:${y}%;width:${size}px">
      <span class="fl" style="animation-duration:${rnd(2, 3.8).toFixed(2)}s;animation-delay:${(-rnd(0, 4)).toFixed(2)}s">
        <svg viewBox="-7 -12 42 24"><use href="#${leafId()}" transform="rotate(${rnd(0, 360).toFixed(0)})" transform-origin="12 0"/></svg>
      </span>
    </span>`
  }).join('')
  layer.insertAdjacentHTML(
    'afterbegin',
    `${DEFS}
    <div class="amb-tree-wrap" aria-hidden="true">
      <img class="amb-tree-img" src="/assets/tree.webp" alt="" draggable="false" />
      ${rustle}
    </div>`
  )

  // --- oak leaves falling from the canopy ---
  const LEAVES = innerWidth < 700 ? 9 : 14
  for (let i = 0; i < LEAVES; i++) {
    const p = el('div', 'leaf')
    p.style.setProperty('--x', `${rnd(2, 46).toFixed(1)}vw`)
    p.style.setProperty('--y0', `${rnd(2, 50).toFixed(1)}vh`)
    p.style.setProperty('--size', `${rnd(16, 27).toFixed(0)}px`)
    p.style.setProperty('--dur', `${rnd(13, 24).toFixed(1)}s`)
    p.style.setProperty('--delay', `${(-rnd(0, 26)).toFixed(1)}s`)
    p.style.setProperty('--sway', `${rnd(5, 20).toFixed(1)}vw`)
    p.style.setProperty('--op', rnd(0.6, 0.92).toFixed(2))
    p.style.setProperty('--spin', `${rnd(7, 15).toFixed(1)}s`)
    p.style.setProperty('--rot0', `${rnd(0, 360).toFixed(0)}deg`)
    p.style.setProperty('--flip', `${rnd(2.8, 5).toFixed(1)}s`)
    p.innerHTML = `<div class="leaf-spin"><div class="leaf-flip"><svg viewBox="-7 -12 42 24"><use href="#${leafId()}"/></svg></div></div>`
    layer.appendChild(p)
  }

  // --- faint candle-light orbs (few, warm) ---
  const ORBS = innerWidth < 700 ? 4 : 6
  for (let i = 0; i < ORBS; i++) {
    const o = el('span', 'orb')
    const size = 6 + Math.random() * 16
    o.style.setProperty('--x', `${rnd(35, 96).toFixed(1)}vw`)
    o.style.setProperty('--y', `${rnd(10, 88).toFixed(1)}vh`)
    o.style.setProperty('--size', `${size.toFixed(1)}px`)
    o.style.setProperty('--blur', `${(size / 10 + 0.6).toFixed(1)}px`)
    o.style.setProperty('--op', rnd(0.14, 0.32).toFixed(2))
    o.style.setProperty('--dx', `${rnd(-7, 7).toFixed(1)}vw`)
    o.style.setProperty('--dy', `${(-4 - Math.random() * 9).toFixed(1)}vh`)
    o.style.setProperty('--sc', rnd(0.8, 1.3).toFixed(2))
    o.style.setProperty('--dur', `${rnd(17, 30).toFixed(1)}s`)
    o.style.setProperty('--pulse', `${rnd(4, 9).toFixed(1)}s`)
    o.style.setProperty('--delay', `${(-rnd(0, 30)).toFixed(1)}s`)
    layer.appendChild(o)
  }

  // pause while the tab is hidden
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('ambient-paused', document.hidden)
  })
}
