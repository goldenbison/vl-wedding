// Countdown to the wedding day.
export function initCountdown(container, targetISO, { title, doneMessage }) {
  const target = new Date(targetISO).getTime()

  container.innerHTML = `
    <div class="countdown-title">${title}</div>
    <div class="count-grid">
      ${['ថ្ងៃ', 'ម៉ោង', 'នាទី', 'វិនាទី']
        .map((l, i) => `
          <div class="count-cell">
            <div class="count-num" data-i="${i}">–</div>
            <div class="count-label">${l}</div>
          </div>`)
        .join('')}
    </div>`
  const cells = [...container.querySelectorAll('.count-num')]

  function tick() {
    const diff = target - Date.now()
    if (diff <= 0) {
      container.innerHTML = `<div class="countdown-done">${doneMessage}</div>`
      clearInterval(timer)
      return
    }
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    const vals = [d, h, m, s]
    cells.forEach((c, i) => {
      const v = String(vals[i]).padStart(2, '0')
      if (c.textContent !== v) c.textContent = v
    })
  }
  tick()
  const timer = setInterval(tick, 1000)
}
