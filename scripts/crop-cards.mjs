// Crops the individual card panels out of the print-shop proof spreads in
// design/originals/ and writes web-ready JPEGs to public/assets/card/.
// Boxes are fractions of the source image so they survive resolution changes.
// Run: node scripts/crop-cards.mjs
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const SRC = 'design/originals'
const OUT = 'public/assets/card'

const S = {
  cover: `${SRC}/KHOV TY VICTOR OP2-01.jpg`, // front + back cover spread
  money: `${SRC}/KHOV TY VICTOR OP2-02.jpg`, // money envelope + map card
  letter: `${SRC}/KHOV TY VICTOR OP2-03.jpg`, // procession letter
  trifold: `${SRC}/KHOV TY VICTOR OP2-04.jpg`, // thanks | invite | agenda
}

// { out, src, box: [fx0, fy0, fx1, fy1], width }
const JOBS = [
  { out: 'cover-front.jpg', src: S.cover, box: [0.0755, 0.1096, 0.4875, 0.8304], width: 1300 },
  { out: 'cover-back.jpg', src: S.cover, box: [0.515, 0.1096, 0.928, 0.8304], width: 1300 },
  { out: 'badge.png', src: S.cover, box: [0.6425, 0.315, 0.8025, 0.598], width: 460, png: true },
  { out: 'panel-thanks.jpg', src: S.trifold, box: [0.0675, 0.0955, 0.2685, 0.7775], width: 900 },
  { out: 'panel-invite.jpg', src: S.trifold, box: [0.2975, 0.1075, 0.7015, 0.752], width: 1500 },
  { out: 'panel-agenda.jpg', src: S.trifold, box: [0.732, 0.0955, 0.9335, 0.7775], width: 900 },
  { out: 'letter-procession.jpg', src: S.letter, box: [0.165, 0.1785, 0.835, 0.6741], width: 1300 },
  { out: 'money-front.jpg', src: S.money, box: [0.095, 0.0723, 0.475, 0.8234], width: 900 },
  // the printed map is rotated 90° to fit the portrait money envelope —
  // un-rotate it so it reads as a normal landscape map on screen
  { out: 'map-card.jpg', src: S.money, box: [0.534, 0.184, 0.902, 0.818], width: 1400, rotate: 90 },
  { out: 'crest.png', src: S.money, box: [0.142, 0.138, 0.431, 0.505], width: 560, png: true, keyOutNavy: true },
  // the printed guest-name frame from the front cover (transparent bg)
  // printed "សូមគោរពអញ្ជើញ" lettering + the name frame, transparent bg
  { out: 'guest-frame.png', src: S.cover, box: [0.139, 0.5862, 0.411, 0.6862], width: 1000, png: true, keyOutNavy: true, clearTop: 12 },
  // the ornate name box alone (no lettering) — used as the open button frame
  { out: 'name-frame.png', src: S.cover, box: [0.139, 0.6136, 0.411, 0.6748], width: 900, png: true, keyOutNavy: true, clearTop: 2 },
]

await mkdir(OUT, { recursive: true })

for (const job of JOBS) {
  const img = sharp(job.src)
  const meta = await img.metadata()
  const [fx0, fy0, fx1, fy1] = job.box
  const left = Math.round(meta.width * fx0)
  const top = Math.round(meta.height * fy0)
  const width = Math.round(meta.width * (fx1 - fx0))
  const height = Math.round(meta.height * (fy1 - fy0))
  let pipe = img.extract({ left, top, width, height })
  if (job.rotate) {
    // sharp orders rotate before extract in a single pipeline — use two passes
    const buf = await pipe.toBuffer()
    pipe = sharp(buf).rotate(job.rotate)
  }
  pipe = pipe.resize({ width: job.width })

  if (job.keyOutNavy) {
    // make the flat navy panel background transparent (keep the gold line art)
    const { data, info: raw } = await pipe.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const [nr, ng, nb] = [30, 38, 87] // #1e2657 panel navy
    for (let i = 0; i < data.length; i += 4) {
      const d = Math.max(Math.abs(data[i] - nr), Math.abs(data[i + 1] - ng), Math.abs(data[i + 2] - nb))
      data[i + 3] = Math.max(0, Math.min(255, Math.round(((d - 16) / 56) * 255)))
    }
    if (job.clearTop) {
      for (let i = 0; i < job.clearTop * raw.width * 4; i += 4) data[i + 3] = 0
    }
    const info = await sharp(data, { raw: { width: raw.width, height: raw.height, channels: 4 } })
      .png()
      .toFile(path.join(OUT, job.out))
    console.log(`${job.out}: keyed ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB (transparent bg)`)
    continue
  }

  pipe = job.png
    ? pipe.png()
    : pipe.jpeg({ quality: 82, progressive: true, mozjpeg: true })
  const info = await pipe.toFile(path.join(OUT, job.out))
  console.log(
    `${job.out}: crop ${width}x${height} @(${left},${top}) -> ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB  AR=${(info.width / info.height).toFixed(3)}`
  )
}

// ---------------------------------------------------------------------------
// Scrub the print-shop watermark from the public-facing crops.
// ---------------------------------------------------------------------------

// cover-back: the damask is mirror-symmetric around the seam, so clone the
// clean bottom-LEFT corner, flip it, and lay it over the bottom-right mark.
{
  const file = path.join(OUT, 'cover-back.jpg')
  const img = sharp(file)
  const { width: W, height: H } = await img.metadata()
  const w = 260
  const h = 160
  const top = H - h - 8
  const patch = await sharp(file).extract({ left: 4, top, width: w, height: h }).flop().toBuffer()
  const buf = await sharp(file).composite([{ input: patch, left: W - w - 4, top }]).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
  await sharp(buf).toFile(file)
  console.log('cover-back.jpg: vendor mark cloned out (bottom-right)')
}

// map-card: the mark sits on flat cream below the QR — paint it over with the
// paper colour sampled from an empty area of the same card.
{
  const file = path.join(OUT, 'map-card.jpg')
  const img = sharp(file)
  const meta = await img.metadata()
  const { data } = await sharp(file).extract({ left: 1320, top: 690, width: 8, height: 8 }).raw().toBuffer({ resolveWithObject: true })
  let r = 0, g = 0, b = 0
  for (let i = 0; i < data.length; i += 3) { r += data[i]; g += data[i + 1]; b += data[i + 2] }
  const n = data.length / 3
  const cream = { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
  const rect = await sharp({ create: { width: 330, height: 205, channels: 3, background: cream } }).jpeg().toBuffer()
  const buf = await sharp(file).composite([{ input: rect, left: 62, top: 528 }]).jpeg({ quality: 86, mozjpeg: true }).toBuffer()
  await sharp(buf).toFile(file)
  console.log(`map-card.jpg: vendor mark painted out with cream rgb(${cream.r},${cream.g},${cream.b})`)
}

// favicon from the badge
await sharp(path.join(OUT, 'badge.png')).resize(96, 96, { fit: 'contain', background: { r: 15, g: 21, b: 56, alpha: 1 } }).png().toFile('public/favicon.png')
console.log('favicon.png written')

// ---- color samples (to keep CSS true to the artwork) ----
async function sampleAt(file, fx, fy) {
  const img = sharp(file)
  const meta = await img.metadata()
  const left = Math.max(0, Math.round(meta.width * fx) - 4)
  const top = Math.max(0, Math.round(meta.height * fy) - 4)
  const { data } = await img.extract({ left, top, width: 9, height: 9 }).raw().toBuffer({ resolveWithObject: true })
  let r = 0, g = 0, b = 0
  const n = data.length / 3
  for (let i = 0; i < data.length; i += 3) { r += data[i]; g += data[i + 1]; b += data[i + 2] }
  const hex = (v) => Math.round(v / n).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

console.log('\ncolor samples:')
console.log('  page backdrop (letter bg):     ', await sampleAt(S.letter, 0.05, 0.5))
console.log('  cover panel royal (top-left):  ', await sampleAt(S.cover, 0.09, 0.14))
console.log('  cover panel center field:      ', await sampleAt(S.cover, 0.275, 0.62))
console.log('  cover-back damask navy:        ', await sampleAt(S.cover, 0.55, 0.8))
console.log('  money panel navy (empty area): ', await sampleAt(S.money, 0.44, 0.55))
console.log('  gold (cover title):            ', await sampleAt(S.cover, 0.275, 0.585))
console.log('  cream (invite panel):          ', await sampleAt(S.trifold, 0.5, 0.65))
