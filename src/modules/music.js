// Background music with on/off toggle.
// If config.music.url is set, an <audio> element is used. Otherwise a small
// WebAudio "music box" plays a rendition of Pachelbel's Canon in D
// (public-domain composition, synthesised locally — no file needed).
import { icon } from './dom.js'


// ---------------------------------------------------------------------------
// music-box engine
// ---------------------------------------------------------------------------
function createMusicBox() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()

  const master = ctx.createGain()
  master.gain.value = 0

  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 4200

  const delay = ctx.createDelay(1.5)
  delay.delayTime.value = 0.42
  const feedback = ctx.createGain()
  feedback.gain.value = 0.28
  const wet = ctx.createGain()
  wet.gain.value = 0.22

  master.connect(lowpass)
  lowpass.connect(ctx.destination)
  lowpass.connect(delay)
  delay.connect(feedback)
  feedback.connect(delay)
  delay.connect(wet)
  wet.connect(ctx.destination)

  const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12)

  function bell(midi, t, vel = 0.28, dur = 2.2) {
    const f = freq(midi)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vel, t + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    g.connect(master)

    const partials = [
      [1, 1],
      [2.01, 0.32],
      [4, 0.12],
    ]
    for (const [ratio, amp] of partials) {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f * ratio
      const og = ctx.createGain()
      og.gain.value = amp
      o.connect(og)
      og.connect(g)
      o.start(t)
      o.stop(t + dur + 0.1)
    }
  }

  // Canon in D — famous descending line over the ground bass, arpeggiated
  const CHORDS = [
    { arp: [74, 81, 78, 86], melody: 90 }, // D
    { arp: [69, 76, 73, 81], melody: 88 }, // A
    { arp: [71, 78, 74, 83], melody: 86 }, // Bm
    { arp: [66, 73, 69, 78], melody: 85 }, // F#m
    { arp: [67, 74, 71, 79], melody: 83 }, // G
    { arp: [74, 78, 81, 86], melody: 81 }, // D
    { arp: [67, 74, 71, 79], melody: 83 }, // G
    { arp: [69, 73, 76, 81], melody: 85 }, // A
  ]
  const CHORD_DUR = 2.4
  const STEP = CHORD_DUR / 4

  let nextChordTime = 0
  let chordIndex = 0
  let timer = null

  function scheduler() {
    while (nextChordTime < ctx.currentTime + 0.35) {
      const c = CHORDS[chordIndex % CHORDS.length]
      bell(c.melody, nextChordTime, 0.34, 2.6)
      c.arp.forEach((n, i) => bell(n, nextChordTime + i * STEP, 0.16, 1.9))
      // soft low root an octave down on the downbeat
      bell(c.arp[0] - 12, nextChordTime, 0.1, 2.6)
      nextChordTime += CHORD_DUR
      chordIndex++
    }
  }

  return {
    async start() {
      await ctx.resume()
      nextChordTime = Math.max(nextChordTime, ctx.currentTime + 0.08)
      if (!timer) timer = setInterval(scheduler, 120)
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setTargetAtTime(0.62, ctx.currentTime, 0.8)
    },
    async stop() {
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.25)
      clearInterval(timer)
      timer = null
      setTimeout(() => ctx.suspend().catch(() => {}), 900)
    },
  }
}

// ---------------------------------------------------------------------------
export function initMusic(btn, url = '') {
  let engine = null
  let audioEl = null
  let playing = false
  let everPlayed = false
  let userMuted = false

  // resolve the song file up-front so the open-tap starts the right source
  // (missing file → music box; hosting rewrites return HTML, not audio)
  if (url) {
    fetch(url, { method: 'HEAD' })
      .then((r) => {
        const type = r.headers.get('content-type') || ''
        if (!r.ok || !(type.startsWith('audio') || type.includes('mpeg') || type.includes('mp4'))) url = ''
      })
      .catch(() => {
        url = ''
      })
  }

  btn.innerHTML = `${icon('note', 'icon note-icon')}<span class="mute-line"></span>`
  btn.dataset.playing = 'false'

  async function play() {
    try {
      if (url) {
        if (!audioEl) {
          audioEl = new Audio(url)
          audioEl.loop = true
          audioEl.volume = 0.75
          audioEl.addEventListener('error', () => {
            // file missing → fall back to the music box
            url = ''
            audioEl = null
            play()
          }, { once: true })
        }
        await audioEl.play()
      } else {
        if (!engine) engine = createMusicBox()
        await engine.start()
      }
      playing = true
      everPlayed = true
      btn.dataset.playing = 'true'
      cleanupKick()
    } catch (err) {
      console.warn('music blocked:', err)
    }
  }

  function stop() {
    if (audioEl) audioEl.pause()
    if (engine) engine.stop()
    playing = false
    btn.dataset.playing = 'false'
  }

  btn.addEventListener('click', () => {
    if (playing) {
      userMuted = true
      stop()
    } else {
      userMuted = false
      play()
    }
  })

  // if autoplay was blocked (silent auto-open, no gesture yet), start on the
  // guest's very first touch — unless they have already muted deliberately
  function kick(e) {
    if (everPlayed || userMuted) {
      cleanupKick()
      return
    }
    if (e.target && e.target.closest && e.target.closest('#musicToggle')) return
    play()
  }
  function cleanupKick() {
    window.removeEventListener('pointerdown', kick)
    window.removeEventListener('keydown', kick)
  }

  return {
    // called right after the envelope is opened —
    // music always starts on; muting lasts only for the current visit
    autostart() {
      play()
      window.addEventListener('pointerdown', kick)
      window.addEventListener('keydown', kick)
    },
    stop,
  }
}
