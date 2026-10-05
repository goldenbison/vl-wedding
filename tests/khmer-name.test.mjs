import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeKhmerName as normalize } from '../src/modules/khmer-name.js'

test('legacy lowered shifters across consonants and above vowels', () => {
  for (const consonant of 'កខគឃចឆជឈដឋឌឍតថទធផពភឞសហអ') {
    for (const vowel of 'ិីឹឺើឿ័៝') {
      assert.equal(normalize(consonant + 'ុ' + vowel), consonant + '៊' + vowel)
      assert.equal(normalize(consonant + vowel + 'ុ'), consonant + '៊' + vowel)
    }
  }
  for (const consonant of 'ងញណនបមយរលវឡ') {
    for (const vowel of 'ិីឹឺើឿ័៝') {
      assert.equal(normalize(consonant + 'ុ' + vowel), consonant + '៉' + vowel)
    }
  }
  assert.equal(normalize('សុីណាត មុី រ៉ានី'), 'ស៊ីណាត ម៉ី រ៉ានី')
})

test('every Khmer consonant, independent vowel, and ordinary vowel stays intact', () => {
  for (let cp = 0x1780; cp <= 0x17b3; cp++) {
    const consonant = String.fromCodePoint(cp)
    assert.equal(normalize(consonant), consonant)
    for (let vp = 0x17b6; vp <= 0x17c5; vp++) {
      const text = consonant + String.fromCodePoint(vp)
      assert.equal(normalize(text), text)
    }
  }
  for (const text of ['សុខា', 'សុំ', 'សូម', 'កុំ', 'ភ្ញៀវ', 'កញ្ញា', 'លោកស្រី', 'ស៊ីណាត', 'ប៊ី', 'ប៉ី', 'អ៊ុំ', 'ម៉ៅ', 'ញ៉ាំ', 'ស្រីពៅ', 'ច័ន្ទ', 'សុវណ្ណ', 'សុខា (Victor) 💙', '']) {
    assert.equal(normalize(text), text)
  }
})

test('orders vowel/sign/subscript tokens without breaking coeng pairs', () => {
  assert.equal(normalize('កី្រ'), 'ក្រី')
  assert.equal(normalize('មី៉'), 'ម៉ី')
  assert.equal(normalize('កំុ'), 'កុំ')
  assert.equal(normalize('សេី'), 'សើ')
  assert.equal(normalize('សេា'), 'សោ')
  assert.equal(normalize('សុេី'), 'ស៊ើ')
  assert.equal(normalize('ស្រុី'), 'ស៊្រី')
  assert.equal(normalize('ម្រុី'), 'ម៉្រី')
  // Never rewrite letters or delete a second mark just to hide an input error.
  for (const text of ['ក្', 'ី', 'កីី', 'ក\u200bខ', 'ក៊\u200cី', 'ក\u200dី', 'ក\u17d2ដ', 'Victor & Lakna', '李明']) {
    assert.equal(normalize(text), text)
  }
})

test('normalization is idempotent across all consonants and subscript clusters', () => {
  for (let cp = 0x1780; cp <= 0x17a2; cp++) {
    for (const ending of ['', 'ុី', 'ីុ', 'េី', 'េា', '៉ី', '្រុី', '្មុី', 'ំុ', 'ុាំ']) {
      const once = normalize(String.fromCodePoint(cp) + ending)
      assert.equal(normalize(once), once)
      assert.ok(!once.includes('undefined'))
    }
  }
})
