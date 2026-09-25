// Measure after fonts load and whenever a frame changes size (including reveal).
export function fitGuestNames() {
  const boxes = [...document.querySelectorAll('.env-guest-name, .hero-guest-name')]
  function fit(box) {
    const label = box.firstElementChild
    const style = getComputedStyle(box)
    const width = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    const height = box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
    if (!label || width <= 0 || height <= 0) return
    label.style.fontSize = ''
    const size = parseFloat(getComputedStyle(label).fontSize)
    const ratio = Math.min(1, width / label.offsetWidth, height / label.offsetHeight)
    label.style.fontSize = `${size * ratio}px`
  }
  const observer = new ResizeObserver(entries => entries.forEach(({ target }) => fit(target)))
  boxes.forEach(box => observer.observe(box))
  document.fonts.ready.then(() => boxes.forEach(fit))
}
