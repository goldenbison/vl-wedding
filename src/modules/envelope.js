// The opening sequence, built from the printed gatefold:
//   tap → the cover spins to its back → the badge splits as the two doors
//   swing open (inner faces = the printed interior panels) → the invitation
//   card presents itself → flies into the hero.
import { $ } from './dom.js'

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches

export function initEnvelope({ onOpen, onCardLanded }) {
  const scene = $('#envelopeScene')
  const flip = $('#envFlip')
  const card = $('#envCard')
  const fly = $('#cardFly')
  let opened = false

  // gentle tilt following the pointer (desktop, before opening)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !REDUCED) {
    scene.addEventListener('pointermove', (e) => {
      if (opened) return
      const dx = e.clientX / innerWidth - 0.5
      const dy = e.clientY / innerHeight - 0.5
      flip.style.transform = `rotateY(${dx * 6}deg) rotateX(${-dy * 4}deg)`
    })
    scene.addEventListener('pointerleave', () => {
      if (!opened) flip.style.transform = ''
    })
  }

  // FLIP the presented card into the hero image position
  function flyCardToHero() {
    const src = $('#envCardImg').getAttribute('src')
    const from = card.getBoundingClientRect()
    fly.innerHTML = `<img src="${src}" alt="" />`
    fly.style.left = `${from.left}px`
    fly.style.top = `${from.top}px`
    fly.style.width = `${from.width}px`
    fly.style.height = `${from.height}px`
    fly.style.transform = 'translate(0, 0) scale(1)'
    fly.hidden = false
    card.style.visibility = 'hidden'
    scene.classList.add('scene-drop')

    const heroImg = onOpen() // reveals the site (opacity 0) and returns the hero image
    requestAnimationFrame(() => {
      const to = heroImg.getBoundingClientRect()
      const scale = to.width / from.width
      fly.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${scale})`
      setTimeout(() => {
        onCardLanded()
        setTimeout(() => {
          fly.hidden = true
          fly.innerHTML = ''
          scene.remove()
        }, 450)
      }, 980)
    })
  }

  function open() {
    if (opened || !scene.isConnected) return
    opened = true
    scene.classList.add('scene-open')
    flip.style.transform = '' // release the pointer tilt; class takes over

    if (REDUCED) {
      onOpen()
      onCardLanded()
      scene.classList.add('scene-exit')
      setTimeout(() => scene.remove(), 600)
      return
    }

    setTimeout(() => flip.classList.add('flipped'), 60)
    setTimeout(() => {
      $('#doorL').classList.add('open')
      $('#doorR').classList.add('open')
    }, 1350)
    setTimeout(() => card.classList.add('card-ready'), 1950)
    setTimeout(flyCardToHero, 2900)
  }

  // a tap always opens
  $('#envTap').addEventListener('click', open)
  $('#envOpenBtn').addEventListener('click', open)

  // …and the letter opens itself after a short moment — counted from when
  // the page has fully loaded, so slow connections still get the full pause.
  // (?hold=1 disables only the auto-open, for design inspection)
  if (!new URLSearchParams(location.search).has('hold')) {
    const arm = () => setTimeout(open, 5000)
    if (document.readyState === 'complete') arm()
    else window.addEventListener('load', arm, { once: true })
  }

  return { open }
}
