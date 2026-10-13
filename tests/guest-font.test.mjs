import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Check actual glyph coverage, not just whether the CSS font request succeeds.
function hasGlyph(font, code) {
  for (let i = 0; i < font.readUInt16BE(4); i++) {
    const table = 12 + i * 16
    if (font.toString('ascii', table, table + 4) !== 'cmap') continue
    const cmap = font.readUInt32BE(table + 8)
    for (let j = 0; j < font.readUInt16BE(cmap + 2); j++) {
      const record = cmap + 4 + j * 8
      const platform = font.readUInt16BE(record)
      if (platform !== 0 && platform !== 3) continue
      const start = cmap + font.readUInt32BE(record + 4)
      if (font.readUInt16BE(start) !== 4) continue
      const count = font.readUInt16BE(start + 6) / 2
      for (let k = 0; k < count; k++) {
        const end = font.readUInt16BE(start + 14 + k * 2)
        const begin = font.readUInt16BE(start + 16 + count * 2 + k * 2)
        if (code < begin || code > end) continue
        const delta = font.readInt16BE(start + 16 + count * 4 + k * 2)
        const rangeAt = start + 16 + count * 6 + k * 2
        const range = font.readUInt16BE(rangeAt)
        const glyph = range ? font.readUInt16BE(rangeAt + range + (code - begin) * 2) : code
        if ((range === 0 || glyph !== 0) && ((glyph + delta) & 0xffff) !== 0) return true
      }
    }
  }
  return false
}

test('one bundled Latin font covers the guest name and French accents', () => {
  const font = readFileSync(new URL('../public/assets/guest-latin-bold.ttf', import.meta.url))
  for (const char of 'Mr. Ekheang Phy & Fiancée ÉÈÊËéèêëàâçîïôùûüÿœŒæÆ\u0301') {
    assert.ok(hasGlyph(font, char.codePointAt(0)), `Missing glyph: ${char}`)
  }
  const khmer = readFileSync(new URL('../public/assets/guest-khmer-bold.ttf', import.meta.url))
  assert.ok(hasGlyph(khmer, 0x1780))
  assert.equal(hasGlyph(khmer, 0xe9), false, 'Regression: original font lacks é')
})
