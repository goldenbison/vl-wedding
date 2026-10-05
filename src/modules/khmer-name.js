// Khmer needs script-aware ordering: String.normalize('NFC') alone does not
// repair keyboard sequences such as សុី / មុី. iOS exposes these as dotted
// circles, while some desktop shapers tolerate them.
// Reference: Unicode ch.16 and SIL's Khmer encoding/normalization rules:
// https://github.com/sillsdev/khmer-character-specification
// Work on complete syllables, never split a coeng from its consonant, and do
// not remove marks, join controls, word boundaries, or change consonant letters.
const base = '[\u1780-\u17a2\u17a5-\u17b3]'
const syllables = new RegExp(`${base}(?:\u17d2${base}|[\u17b6-\u17d1\u17d3\u17dd])*`, 'gu')
const tokens = new RegExp(`\u17d2${base}|.`, 'gu')
const strong = /[\u1780-\u1783\u1785-\u1788\u178a-\u178d\u178f-\u1792\u1795-\u1797\u179e-\u17a0\u17a2]/u
const above = /[\u17b7-\u17ba\u17be\u17bf\u17d0\u17dd]|\u17b6\u17c6/u

function order(token) {
  if (token === '\u17cc') return 1 // robat
  if (token === '\u17c9' || token === '\u17ca') return 2 // shifter, after base
  if (token.startsWith('\u17d2')) return 3 // intact subscript pair
  if (/[\u17be-\u17c5]/u.test(token)) return 4
  if (/[\u17bb-\u17bd]/u.test(token)) return 5
  if (/[\u17b7-\u17ba]/u.test(token)) return 6
  if (token === '\u17b6') return 7
  if (token === '\u17c7' || token === '\u17c8') return 9
  return 8 // nikahit and other final marks
}

export function normalizeKhmerName(name) {
  return name.replace(syllables, syllable => {
    const [initial, ...parts] = syllable.match(tokens)
    // Stable sort preserves the order of multiple subscripts and final marks.
    parts.sort((a, b) => order(a) - order(b))
    let tail = parts.join('')
    // Visually decomposed vowels: e + ii = oe; e + aa = oo.
    tail = tail.replace(/\u17c1([\u17bb-\u17bd]?)\u17b8/gu, '\u17be$1')
      .replace(/\u17c1([\u17bb-\u17bd]?)\u17b6/gu, '\u17c4$1')
    // A below-u plus an above vowel is legacy typing for a lowered shifter.
    // Leave real ុ / ុំ vowels and explicitly chosen shifters unchanged.
    if (!/[\u17c9\u17ca]/u.test(tail) && tail.includes('\u17bb') && above.test(tail)) {
      const consonants = initial + (tail.match(new RegExp(`\u17d2${base}`, 'gu')) || []).join('')
      const shifter = !consonants.includes('ប') && strong.test(consonants) ? '\u17ca' : '\u17c9'
      tail = shifter + tail.replace('\u17bb', '')
    }
    return initial + (tail.match(tokens) || []).sort((a, b) => order(a) - order(b)).join('')
  })
}
