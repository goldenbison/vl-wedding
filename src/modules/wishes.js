// Wishes wall — Firestore (live, shared by all guests) with a localStorage
// demo fallback while Firebase isn't configured yet. The sender's name comes
// from the guest's personalized link; the form is message-only.
import { wishes as cfg } from '../config.js'
import { $, esc, icon, toast } from './dom.js'
import { getDb, isConfigured } from './firebase.js'

const DEMO_KEY = 'vl-wishes-demo'
const MSG_MAX = 600
const PAGE_SIZE = 10
const KH_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
const khNum = (n) => String(n).split('').map((d) => KH_DIGITS[+d] ?? d).join('')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtDateTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const p = (x) => String(x).padStart(2, '0')
  const h12 = d.getHours() % 12 || 12
  const ampm = d.getHours() < 12 ? 'AM' : 'PM'
  return `${p(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${h12}:${p(d.getMinutes())} ${ampm}`
}

function wishCard(w) {
  return `
    <div class="wish-card">
      ${icon('quote')}
      <div class="wish-msg">${esc(w.message)}</div>
      <div class="wish-meta">
        <div class="wish-name">— ${esc(w.name)}</div>
        <div class="wish-time">${fmtDateTime(w.ts)}</div>
      </div>
    </div>`
}

export async function initWishes(root, guestName = '') {
  const listEl = $('.wish-list', root)
  const pagerEl = $('.wish-pager', root)
  const form = $('.wish-form', root)
  const msgInput = $('textarea[name=message]', form)
  const submitBtn = $('button[type=submit]', form)
  const senderName = guestName || 'ភ្ញៀវកិត្តិយស'

  let items = []
  let page = 1

  function renderPage() {
    if (!items.length) {
      listEl.innerHTML = `<div class="wish-empty">${esc(cfg.emptyLabel)}</div>`
      pagerEl.hidden = true
      return
    }
    const pages = Math.ceil(items.length / PAGE_SIZE)
    page = Math.min(Math.max(1, page), pages)
    const slice = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    listEl.innerHTML = slice.map(wishCard).join('')
    pagerEl.hidden = pages <= 1
    if (pages > 1) {
      $('.wp-label', pagerEl).textContent = `${khNum(page)} / ${khNum(pages)}`
      $('.wp-prev', pagerEl).disabled = page <= 1
      $('.wp-next', pagerEl).disabled = page >= pages
    }
  }

  $('.wp-prev', pagerEl).addEventListener('click', () => { page--; renderPage() })
  $('.wp-next', pagerEl).addEventListener('click', () => { page++; renderPage() })

  // -------------------------------------------------------------------------
  let submit // (message) => Promise

  const live = await getDb().catch((e) => {
    console.warn('Firestore unavailable, falling back to demo mode:', e)
    return null
  })

  if (live) {
    const { db, fs } = live
    const col = fs.collection(db, 'wishes')
    const q = fs.query(col, fs.orderBy('createdAt', 'desc'), fs.limit(300))
    fs.onSnapshot(
      q,
      (snap) => {
        items = snap.docs.map((d) => {
          const data = d.data()
          return {
            name: data.name,
            message: data.message,
            ts: data.createdAt ? data.createdAt.toMillis() : Date.now(),
          }
        })
        renderPage()
      },
      (err) => console.error('wishes snapshot error:', err)
    )
    submit = (message) =>
      fs.addDoc(col, { name: senderName, message, createdAt: fs.serverTimestamp() })
  } else {
    // demo mode — this browser only
    if (!isConfigured() && location.hostname === 'localhost') {
      console.info('%cDemo mode: wishes are stored in this browser only. Paste firebaseConfig in src/config.js to go live.', 'color:#c39a48')
    }
    const load = () => {
      try {
        const raw = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null')
        if (Array.isArray(raw)) return raw
      } catch {}
      const seed = cfg.demoSeed.map((w, i) => ({
        ...w,
        ts: Date.now() - (i + 2) * 3600000,
      }))
      localStorage.setItem(DEMO_KEY, JSON.stringify(seed))
      return seed
    }
    items = load()
    renderPage()
    submit = async (message) => {
      items = [{ name: senderName, message, ts: Date.now() }, ...items]
      localStorage.setItem(DEMO_KEY, JSON.stringify(items))
      page = 1
      renderPage()
    }
  }

  // -------------------------------------------------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const message = msgInput.value.trim().slice(0, MSG_MAX)
    if (!message) {
      toast('សូមសរសេរពាក្យជូនពរជាមុនសិន', true)
      return
    }
    submitBtn.disabled = true
    try {
      await submit(message)
      msgInput.value = ''
      toast('អរគុណសម្រាប់ពាក្យជូនពរ 🕊️')
    } catch (err) {
      console.error(err)
      toast('មានបញ្ហាក្នុងការផ្ញើ សូមព្យាយាមម្តងទៀត', true)
    } finally {
      // small cooldown against accidental double posts
      setTimeout(() => (submitBtn.disabled = false), 4000)
    }
  })
}
