// Deterministic social card using the invitation's existing crest and palette.
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'

const crest = (await readFile('public/assets/card/crest.png')).toString('base64')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="navy"><stop stop-color="#293466"/><stop offset="1" stop-color="#0e1040"/></radialGradient>
    <linearGradient id="gold" x2="1" y2="1"><stop stop-color="#f2e3bb"/><stop offset=".5" stop-color="#d9ae63"/><stop offset="1" stop-color="#ecd6a0"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#navy)"/>
  <rect x="24" y="24" width="1152" height="582" rx="3" fill="none" stroke="#b98f45"/>
  <rect x="33" y="33" width="1134" height="564" rx="2" fill="none" stroke="#b98f45" opacity=".35"/>
  <path d="M48 83V48H83 M1117 48H1152V83 M48 547V582H83 M1117 582H1152V547" fill="none" stroke="#e3c583" stroke-width="2"/>
  <image x="77" y="117" width="285" height="351" xlink:href="data:image/png;base64,${crest}"/>
  <path d="M409 122V508" stroke="#d9ae63" opacity=".35"/>
  <g text-anchor="middle" fill="url(#gold)">
    <text x="782" y="168" font-family="Georgia, serif" font-size="19" letter-spacing="5">YOU ARE CORDIALLY INVITED</text>
    <text x="782" y="263" font-family="Georgia, serif" font-size="64">Victor &amp; Lakna</text>
    <text x="782" y="311" font-family="Georgia, serif" font-size="22" font-style="italic">Together with our families</text>
    <path d="M624 349H760 M804 349H940 M774 349L782 341L790 349L782 357Z" fill="none" stroke="#d9ae63"/>
    <text x="782" y="401" font-family="Georgia, serif" font-size="29" letter-spacing="2">04 NOVEMBER 2026</text>
    <text x="782" y="444" font-family="Georgia, serif" font-size="21">5:00 PM · Sokha Phnom Penh Hotel</text>
    <text x="782" y="522" font-family="Georgia, serif" font-size="18" letter-spacing="3">VICTORLAKNA.COM</text>
  </g>
</svg>`
await sharp(Buffer.from(svg)).jpeg({ quality: 90, mozjpeg: true }).toFile('public/assets/wedding-preview-v1.jpg')
console.log('Created public/assets/wedding-preview-v1.jpg (1200 × 630)')
