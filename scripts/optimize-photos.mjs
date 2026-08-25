// Optimize gallery photos for the web (long edge 1800px, mozjpeg q78).
//
// Usage:
//   node scripts/optimize-photos.mjs <inputDir> <outputDir>
//       optimize a local folder of photos
//
//   node scripts/optimize-photos.mjs --from-storage <outputDir>
//       download every file under gallery/ from the live Firebase bucket
//       (public read), optimize, and write ready-to-re-upload album folders
import sharp from 'sharp'
import { readdir, mkdir, copyFile, stat } from 'node:fs/promises'
import path from 'node:path'

const BUCKET = 'vl-wedding.firebasestorage.app'
const PREFIX = 'gallery/'
const LONG_EDGE = 1800
const QUALITY = 78
const CONCURRENCY = 6

const IMG_RE = /\.(jpe?g|png|webp)$/i
const VID_RE = /\.(mp4|webm|mov|m4v)$/i

let totalIn = 0
let totalOut = 0
let done = 0
let count = 0

async function optimizeBuffer(buf, outPath) {
  const img = sharp(buf, { failOn: 'none' }).rotate() // honor EXIF orientation
  const meta = await img.metadata()
  const long = Math.max(meta.width || 0, meta.height || 0)
  const pipeline = long > LONG_EDGE
    ? img.resize({ width: meta.width >= meta.height ? LONG_EDGE : undefined, height: meta.height > meta.width ? LONG_EDGE : undefined })
    : img
  const info = await pipeline.jpeg({ quality: QUALITY, progressive: true, mozjpeg: true }).toFile(outPath)
  return info.size
}

async function runPool(jobs) {
  const queue = [...jobs]
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const job = queue.shift()
      try {
        await job()
      } catch (e) {
        console.error('  ✗', e.message)
      }
      done++
      if (done % 10 === 0 || done === count) console.log(`  … ${done}/${count}`)
    }
  })
  await Promise.all(workers)
}

// ---------------------------------------------------------------------------
async function listStorage() {
  const names = []
  let pageToken = ''
  do {
    const url = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?prefix=${encodeURIComponent(PREFIX)}&maxResults=1000${pageToken ? `&pageToken=${pageToken}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`list failed: HTTP ${res.status} — are the Storage rules public-read?`)
    const data = await res.json()
    for (const item of data.items || []) names.push(item.name)
    pageToken = data.nextPageToken || ''
  } while (pageToken)
  return names
}

async function fromStorage(outDir) {
  console.log('listing bucket…')
  const names = (await listStorage()).filter((n) => !n.endsWith('/'))
  count = names.length
  console.log(`${count} files under ${PREFIX}`)

  const jobs = names.map((name) => async () => {
    const rel = name.slice(PREFIX.length) // e.g. siemreap/RA3_1848.jpg
    const outPath = path.join(outDir, rel)
    await mkdir(path.dirname(outPath), { recursive: true })
    const res = await fetch(`https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(name)}?alt=media`)
    if (!res.ok) throw new Error(`${rel}: HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    totalIn += buf.length
    if (VID_RE.test(rel) || !IMG_RE.test(rel)) {
      await sharp(buf).toFile(outPath).catch(async () => {
        const { writeFile } = await import('node:fs/promises')
        await writeFile(outPath, buf)
      })
      totalOut += buf.length
      return
    }
    totalOut += await optimizeBuffer(buf, outPath.replace(/\.(png|webp)$/i, '.jpg'))
  })
  await runPool(jobs)
}

async function fromLocal(inDir, outDir) {
  const entries = await readdir(inDir, { recursive: true })
  const files = entries.filter((f) => IMG_RE.test(f) || VID_RE.test(f))
  count = files.length
  console.log(`${count} files in ${inDir}`)
  const jobs = files.map((rel) => async () => {
    const inPath = path.join(inDir, rel)
    const outPath = path.join(outDir, rel)
    await mkdir(path.dirname(outPath), { recursive: true })
    totalIn += (await stat(inPath)).size
    if (VID_RE.test(rel)) {
      await copyFile(inPath, outPath)
      totalOut += (await stat(inPath)).size
      return
    }
    const buf = await (await import('node:fs/promises')).readFile(inPath)
    totalOut += await optimizeBuffer(buf, outPath.replace(/\.(png|webp)$/i, '.jpg'))
  })
  await runPool(jobs)
}

// ---------------------------------------------------------------------------
const [a, b] = process.argv.slice(2)
const mb = (n) => (n / 1048576).toFixed(1) + 'MB'

if (a === '--from-storage' && b) {
  await fromStorage(b)
} else if (a && b) {
  await fromLocal(a, b)
} else {
  console.log('Usage:\n  node scripts/optimize-photos.mjs <inputDir> <outputDir>\n  node scripts/optimize-photos.mjs --from-storage <outputDir>')
  process.exit(1)
}
console.log(`\ndone: ${mb(totalIn)} → ${mb(totalOut)}  (saved ${(100 - (totalOut / totalIn) * 100).toFixed(0)}%)`)
