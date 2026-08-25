// Pre-wedding gallery — reads albums (sub-folders) from Firebase Storage.
// Shows a shuffled grid of 6; swipe or the chevron reveals the next 6, with
// the upcoming page preloaded so turning feels instant. Album chips filter
// to one folder; tapping the active chip again clears back to "all".
import { gallery as cfg } from '../config.js'
import { $, esc, icon } from './dom.js'
import { getStorageApi } from './firebase.js'
import { openLightbox } from './lightbox.js'

const PAGE = 6
const ALBUM_LABELS = { siemreap: 'Siem Reap', tokyo: 'Tokyo' }
const labelFor = (key) =>
  ALBUM_LABELS[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1)

const isVideoName = (n) => /\.(mp4|webm|mov|m4v)$/i.test(n)

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function loadFromFirebase() {
  const api = await getStorageApi()
  if (!api) return null
  const { storage, st } = api

  const jobs = []
  const collect = (itemRef, album) =>
    jobs.push(
      st.getDownloadURL(itemRef).then((url) => ({
        type: isVideoName(itemRef.name) ? 'video' : 'image',
        src: url,
        album,
        caption: album ? labelFor(album) : '',
        name: itemRef.name,
      }))
    )

  const root = await st.listAll(st.ref(storage, cfg.storagePath))
  root.items.forEach((r) => collect(r, ''))
  const subs = await Promise.all(
    root.prefixes.map((p) => st.listAll(p).then((res) => ({ name: p.name, res })))
  )
  for (const { name, res } of subs) res.items.forEach((r) => collect(r, name))

  const items = await Promise.all(jobs)
  return items.length ? items : null
}

export async function initGallery(root) {
  const grid = $('.gallery-grid', root)
  const chipsEl = $('.g-chips', root)
  const nextBtn = $('.g-next', root)
  const prevBtn = $('.g-prev', root)

  let all = null
  try {
    all = await loadFromFirebase()
  } catch (e) {
    console.warn('gallery: Firebase Storage unavailable:', e)
  }
  if (!all) all = cfg.local.map((x) => ({ ...x, album: '', caption: x.caption || '' }))

  const albums = [...new Set(all.map((i) => i.album).filter(Boolean))]
  let filter = null
  let pool = []
  let page = 0

  function rebuildPool() {
    pool = shuffle(filter ? all.filter((i) => i.album === filter) : all)
    page = 0
  }

  // the final page pulls back so a partial remainder still shows a full six
  const pageSlice = () => {
    const start = Math.min(page * PAGE, Math.max(0, pool.length - PAGE))
    return pool.slice(start, start + PAGE)
  }

  // ---- preloading -----------------------------------------------------------
  const preloaded = new Set()
  function preload(items) {
    for (const it of items) {
      if (it.type !== 'image' || preloaded.has(it.src)) continue
      preloaded.add(it.src)
      const im = new Image()
      im.decoding = 'async'
      im.src = it.src
    }
  }
  function preloadUpcoming() {
    const pages = Math.ceil(pool.length / PAGE) || 1
    const nStart = ((page + 1) % pages) * PAGE
    const pStart = ((page - 1 + pages) % pages) * PAGE
    preload(pool.slice(nStart, nStart + PAGE))
    preload(pool.slice(pStart, pStart + PAGE))
  }

  // ---- rendering ------------------------------------------------------------
  const tileMarkup = (it, poolIndex) => `
    <button class="g-item" type="button" data-pi="${poolIndex}" aria-label="${esc(it.caption) || 'រូបភាព'}">
      ${
        it.type === 'video'
          ? `<video src="${esc(it.src)}" preload="metadata" muted playsinline></video>
             <span class="g-play">${icon('play')}</span>`
          : `<img src="${esc(it.src)}" alt="${esc(it.caption) || 'Pre-wedding photo'}" decoding="async" draggable="false" />`
      }
    </button>`

  function paint() {
    const items = pageSlice()
    grid.innerHTML = items.length
      ? items.map((it, i) => tileMarkup(it, page * PAGE + i)).join('')
      : `<div class="g-empty">មិនទាន់មានរូបភាពនៅឡើយទេ</div>`
    preload(items)
    preloadUpcoming()
  }

  function renderGrid(dir = 0) {
    if (dir === 0) {
      paint()
      return
    }
    grid.classList.add(dir > 0 ? 'g-exit-l' : 'g-exit-r')
    setTimeout(() => {
      paint()
      grid.classList.remove('g-exit-l', 'g-exit-r')
      grid.classList.add(dir > 0 ? 'g-enter-r' : 'g-enter-l')
      void grid.offsetWidth
      grid.classList.remove('g-enter-r', 'g-enter-l')
    }, 230)
  }

  function advance(dir = 1) {
    if (pool.length <= PAGE) {
      rebuildPool() // a fresh shuffle even when there is just one page
    } else if (dir > 0) {
      page++
      if (page * PAGE >= pool.length) rebuildPool() // wrapped → reshuffle
    } else {
      const pages = Math.ceil(pool.length / PAGE)
      page = page > 0 ? page - 1 : pages - 1
    }
    renderGrid(dir)
  }

  // ---- chips ----------------------------------------------------------------
  if (albums.length > 1) {
    chipsEl.innerHTML = albums
      .map((a) => `<button class="g-chip" type="button" data-album="${esc(a)}">${esc(labelFor(a))}</button>`)
      .join('')
    chipsEl.addEventListener('click', (e) => {
      const b = e.target.closest('.g-chip')
      if (!b) return
      filter = filter === b.dataset.album ? null : b.dataset.album
      ;[...chipsEl.children].forEach((c) =>
        c.classList.toggle('active', c.dataset.album === filter)
      )
      rebuildPool()
      renderGrid(1)
    })
  } else {
    chipsEl.hidden = true
  }

  // ---- interactions ---------------------------------------------------------
  nextBtn.addEventListener('click', () => advance(1))
  prevBtn.addEventListener('click', () => advance(-1))

  let swipeX = null
  let suppressClick = false
  grid.addEventListener('pointerdown', (e) => (swipeX = e.clientX))
  grid.addEventListener('pointerup', (e) => {
    if (swipeX == null) return
    const dx = e.clientX - swipeX
    swipeX = null
    if (Math.abs(dx) > 42) {
      suppressClick = true
      setTimeout(() => (suppressClick = false), 350)
      advance(dx < 0 ? 1 : -1)
    }
  })

  grid.addEventListener('click', (e) => {
    if (suppressClick) return
    const btn = e.target.closest('.g-item')
    if (btn) openLightbox(pool, Number(btn.dataset.pi))
  })

  rebuildPool()
  renderGrid(0)
}
