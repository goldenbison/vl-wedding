// ============================================================================
//  Victor & Luxlakna — digital wedding invitation
//  Every visual is the real printed artwork; see scripts/crop-cards.mjs
// ============================================================================
import { couple, event, art, sections, gallery, wishes, music, misc } from './config.js'
import { $, $$, esc, sectionTitle, artCard, paperCard, icon, sprinkleStars } from './modules/dom.js'
import { initEnvelope } from './modules/envelope.js'
import { initMusic } from './modules/music.js'
import { startAmbient } from './modules/ambient.js'
import { initCountdown } from './modules/countdown.js'
import { gcalHref } from './modules/calendar.js'
import { initGallery } from './modules/gallery.js'
import { initWishes } from './modules/wishes.js'

const params = new URLSearchParams(window.location.search)
const guestName =
  (params.get('to') || params.get('guest') || '').trim().slice(0, 60) || misc.defaultGuest

// a reload always starts at the sealed envelope, never at a restored scroll
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

// ---------------------------------------------------------------------------
// Scene 1 — envelope
// ---------------------------------------------------------------------------
function renderEnvelope() {
  $('#envCover').src = art.coverFront.src
  $('#envCover').alt = art.coverFront.alt
  $('#envCardImg').src = art.invite.src
  $('#envCardImg').alt = art.invite.alt
  $('#doorInnerL').src = art.thanks.src
  $('#doorInnerL').alt = art.thanks.alt
  $('#doorInnerR').src = art.agenda.src
  $('#doorInnerR').alt = art.agenda.alt

  const g = $('#envGuestName')
  const box = art.guestBox
  g.style.left = `${box.left}%`
  g.style.top = `${box.top}%`
  g.style.width = `${box.width}%`
  g.style.height = `${box.height}%`
  g.textContent = guestName || ''

  const openBtn = $('#envOpenBtn')
  openBtn.textContent = misc.openButton
  openBtn.dataset.label = misc.openButton
  sprinkleStars($('.env-stars'), 16)
}

// ---------------------------------------------------------------------------
// Hero — the invitation panel (landing spot for the flying card)
// ---------------------------------------------------------------------------
function renderHero() {
  $('#home').innerHTML = `
    <div class="hero-inner">
      <div class="hero-card-wrap">
        <figure class="art-card">
          <img id="heroCard" src="${esc(art.invite.src)}" alt="${esc(art.invite.alt)}" draggable="false" />
        </figure>
      </div>
      ${guestName ? `
      <div class="hero-guest-block">
        <div class="hero-guest-frame">
          <img src="${esc(art.guestFrame.src)}" alt="${esc(misc.guestLabel)}" draggable="false" />
          <span class="hero-guest-name">${esc(guestName)}</span>
        </div>
      </div>` : ''}
      <div class="countdown" id="countdown"></div>
      <div class="scroll-cue">${esc(misc.scrollHint)} ${icon('chevron')}</div>
    </div>`
  initCountdown($('#countdown'), event.dateISO, {
    title: misc.countdownTitle,
    doneMessage: misc.countdownDone,
  })
}

// ---------------------------------------------------------------------------
// Artwork sections
// ---------------------------------------------------------------------------
function renderProcession() {
  $('#procession').innerHTML = `
    <div class="section-inner">
      ${sectionTitle(sections.procession.kh, sections.procession.en)}
      ${artCard(art.letter)}
    </div>`
}

function renderAgenda() {
  $('#agenda').innerHTML = `
    <div class="section-inner narrow">
      ${sectionTitle(sections.agenda.kh, sections.agenda.en)}
      ${artCard(art.agenda)}
    </div>`
}

function renderLocation() {
  $('#location').innerHTML = `
    <div class="section-inner">
      ${sectionTitle(sections.location.kh, sections.location.en)}
      ${artCard(art.mapCard)}
      <div class="loc-venue-en reveal">${esc(event.venueEn)}</div>
      <div class="loc-buttons reveal">
        <a class="btn btn-gold" href="${esc(event.mapsUrl)}" target="_blank" rel="noopener">${icon('pin')} ${esc(misc.mapButton)}</a>
        <a class="btn btn-gold" href="${gcalHref()}" target="_blank" rel="noopener">${icon('calendar')} ${esc(misc.gcalButton)}</a>
      </div>
    </div>`
}

function renderThanks() {
  $('#thanks').innerHTML = `
    <div class="section-inner narrow">
      ${sectionTitle(sections.thanks.kh, sections.thanks.en)}
      ${artCard(art.thanks)}
    </div>`
}

// ---------------------------------------------------------------------------
// Gallery, wishes, footer
// ---------------------------------------------------------------------------
function renderGallery() {
  $('#gallery').innerHTML = `
    <div class="section-inner">
      ${sectionTitle(sections.gallery.kh, sections.gallery.en)}
      <div class="reveal">
        <div class="g-chips"></div>
        <div class="g-stage">
          <div class="g-viewport">
            <div class="gallery-grid"></div>
          </div>
          <button class="g-prev" type="button" aria-label="រូបភាពមុន">${icon('left')}</button>
          <button class="g-next" type="button" aria-label="រូបភាពបន្ថែម">${icon('right')}</button>
        </div>
      </div>
    </div>`
}

function renderWishes() {
  const inner = `
    <div class="wish-ornament" aria-hidden="true">
      <span class="wo-line"></span>
      ${icon('rings', 'icon wo-rings')}
      <span class="wo-line"></span>
    </div>
    <form class="wish-form">
      <div class="wish-field">
        <textarea id="wishMsg" name="message" maxlength="600" aria-label="ពាក្យជូនពរ" placeholder="${esc(wishes.messagePlaceholder)}"></textarea>
      </div>
      <button class="btn btn-gold" type="submit">${icon('heartsend')} ${esc(wishes.submitLabel)}</button>
    </form>`
  $('#wishes').innerHTML = `
    <div class="section-inner wide">
      ${sectionTitle(sections.wishes.kh, sections.wishes.en)}
      <div class="wish-layout">
        <div>${paperCard(inner)}</div>
        <div class="wish-right">
          <div class="wish-list"></div>
          <div class="wish-pager" hidden>
            <button class="wp-prev" type="button" aria-label="មុន">${icon('left')}</button>
            <span class="wp-label"></span>
            <button class="wp-next" type="button" aria-label="បន្ទាប់">${icon('right')}</button>
          </div>
        </div>
      </div>
    </div>`
}

function renderFooter() {
  $('#footer').innerHTML = `
    <img class="footer-crest" src="${esc(art.crest.src)}" alt="" loading="lazy" />
    <div class="footer-names">${esc(couple.groom.en)} &nbsp;&amp;&nbsp; ${esc(couple.bride.en)}</div>
    <div class="footer-date">${esc(event.dayEn)} ${esc(event.timeEn)}</div>
    <div class="footer-line">${esc(misc.footerLine)}</div>`
}

// ---------------------------------------------------------------------------
// Dock navigation
// ---------------------------------------------------------------------------
const DOCK_ITEMS = [
  { id: 'home', icon: 'home', label: 'ដើម' },
  { id: 'agenda', icon: 'list', label: 'កម្មវិធី' },
  { id: 'location', icon: 'pin', label: 'ទីតាំង' },
  { id: 'gallery', icon: 'photo', label: 'រូបភាព' },
  { id: 'wishes', icon: 'wishlove', label: 'ជូនពរ' },
]

function renderDock() {
  const dock = $('#dock')
  dock.innerHTML = DOCK_ITEMS.map(
    (d) => `
    <button class="dock-btn" type="button" data-target="${d.id}" aria-label="${d.label}" title="${d.label}">
      ${icon(d.icon)}
    </button>`
  ).join('')
  dock.addEventListener('click', (e) => {
    const btn = e.target.closest('.dock-btn')
    if (!btn) return
    document.getElementById(btn.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function setupDockSpy() {
  const buttons = $$('.dock-btn')
  const byId = Object.fromEntries(buttons.map((b) => [b.dataset.target, b]))
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && byId[entry.target.id]) {
          buttons.forEach((b) => b.classList.remove('active'))
          byId[entry.target.id].classList.add('active')
        }
      }
    },
    { rootMargin: '-42% 0px -52% 0px' }
  )
  DOCK_ITEMS.forEach((d) => spy.observe(document.getElementById(d.id)))
}

function setupReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in-view')
          io.unobserve(e.target)
        }
      }
    },
    { threshold: 0.12 }
  )
  $$('.reveal').forEach((n) => io.observe(n))
}

// the music toggle lives only at the very top of the page
function setupMusicToggleVisibility() {
  const btn = $('#musicToggle')
  const update = () => btn.classList.toggle('mt-hide', window.scrollY > 10)
  window.addEventListener('scroll', update, { passive: true })
  update()
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
renderEnvelope()
renderHero()
renderProcession()
renderAgenda()
renderLocation()
renderGallery()
renderWishes()
renderThanks()
renderFooter()
renderDock()

const musicCtl = initMusic($('#musicToggle'), music.url)
initGallery($('#gallery'))
initWishes($('#wishes'), guestName)
startAmbient()

const site = $('#site')
let landed = false

// phase 1: make the site measurable (still invisible) and return the hero img
function prepareSiteForLanding() {
  site.hidden = false
  window.scrollTo(0, 0)
  return $('#heroCard')
}

// phase 2: fade the site in once the card lands in the hero
function finishReveal() {
  if (landed) return
  landed = true
  document.body.classList.remove('is-locked')
  site.classList.add('site-in')
  $('#musicToggle').hidden = false
  const dock = $('#dock')
  dock.hidden = false
  requestAnimationFrame(() => dock.classList.add('dock-in'))
  setupReveal()
  setupDockSpy()
  setupMusicToggleVisibility()
}

initEnvelope({
  onOpen() {
    musicCtl.autostart()
    // watchdog: even if the landing animation stalls (e.g. the tab is
    // backgrounded mid-flight), the site must still reveal
    setTimeout(finishReveal, 4500)
    return prepareSiteForLanding()
  },
  onCardLanded: finishReveal,
})

// dev shortcut: ?skip=1 jumps straight past the envelope (no music autostart —
// browsers block audio without a user gesture)
if (params.has('skip')) {
  $('#envelopeScene').remove()
  prepareSiteForLanding()
  finishReveal()
}
