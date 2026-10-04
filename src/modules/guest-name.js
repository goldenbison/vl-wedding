// Measure after fonts load and whenever a frame changes size (including reveal).
export function fitGuestNames() {
  const boxes = [...document.querySelectorAll('.env-guest-name, .hero-guest-name, .env-open-label')]
  function fit(box) {
    const label = box.firstElementChild
    const style = getComputedStyle(box)
    const width = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    const height = box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
    if (!label || width <= 0 || height <= 0) return
    label.style.fontSize = ''
    const size = parseFloat(getComputedStyle(label).fontSize)
    // Leave a small safety inset for Khmer marks and fractional mobile pixels.
    // Re-measure after resizing: glyph hinting need not scale exactly linearly.
    let fitted = size
    for (let attempt = 0; attempt < 4; attempt++) {
      const ratio = Math.min(1, (width - 2) / Math.max(1, label.offsetWidth), (height - 2) / Math.max(1, label.offsetHeight))
      if (ratio >= 1) break
      fitted = Math.max(1, fitted * ratio)
      label.style.fontSize = `${fitted}px`
    }
  }
  const observer = new ResizeObserver(entries => entries.forEach(({ target }) => fit(target)))
  boxes.forEach(box => observer.observe(box))
  // Hidden hero content does not necessarily trigger font loading by itself.
  // Explicitly request the complete font before measuring either name frame.
  document.fonts.load('700 20px "Guest Khmer"').then(() => boxes.forEach(fit)).catch(() => boxes.forEach(fit))
  document.fonts.ready.then(() => boxes.forEach(fit))
  document.fonts.addEventListener('loadingdone', () => boxes.forEach(fit))
}
