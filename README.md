# Victor & Luxlakna — Digital Wedding Invitation 💍

A Paperless-Post-style invitation for the wedding of **Khov Ty Victor & Nith Luxlakna**
— Wednesday, 04 November 2026, 5:00 PM, Sokha Phnom Penh Hotel (Chroy Changvar).

**Every visual is the real printed artwork.** The design proofs
(`design/originals/KHOV TY VICTOR OP2-0*.jpg`) are cropped into web assets by
`scripts/crop-cards.mjs`:

- front = the printed cover (guest name rendered inside its printed frame)
- back = the printed gatefold; the badge splits at the seam as the two doors open
- door inner faces = the printed interior panels (gratitude · programme)
- the presented card = the actual invitation panel
- sections embed the real panels: procession letter, programme, gratitude, map card
  (the map is un-rotated to its natural landscape orientation)

Flow: cover → spins to the gatefold back → the doors swing open showing the printed
interior → the invitation card presents itself → flies into place as the page hero →
countdown, programme, map, gallery, wishes wall, music (on/off), soft golden bokeh.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5199
```

Handy dev URLs:

- `http://localhost:5199/?to=បង ដារ៉ា` — personalized guest name on the cover & hero
- `http://localhost:5199/?skip=1` — skip the envelope while developing

## Editing

| What | Where |
| --- | --- |
| Names, date, venue, section titles, UI strings | `src/config.js` |
| The invitation artwork itself | replace the proofs in `design/originals/`, tweak crop boxes in `scripts/crop-cards.mjs`, run `node scripts/crop-cards.mjs` |
| Guest-name position on the cover | `art.guestBox` in `src/config.js` (percentages of the cover image) |
| Music | the wedding song ships at `public/assets/music/song.mp3` (Bear McCreary — Lucrezia Donati); replace that file to change it. If the file is removed, the built-in music box (Canon in D) plays instead |
| Local gallery photos (without Firebase) | files in `public/assets/gallery/` + list in `gallery.local` |

If the print shop sends a revised proof, overwrite the file in `design/originals/`,
re-run the crop script, done — the site updates everywhere.

## Go live with Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (e.g. `vl-wedding`).
2. **Build → Firestore Database → Create database** (production mode, `asia-southeast1`).
3. **Build → Storage → Get started.**
4. Project settings → **Your apps → Web app (</>)** → register → copy the config object
   into `firebaseConfig` in `src/config.js`.
5. Deploy hosting + security rules:

```bash
npm install -g firebase-tools
firebase login
cp .firebaserc.example .firebaserc   # put your real project id inside
firebase deploy
```

While `firebaseConfig` is `null` the site runs in **demo mode**: wishes save to
localStorage (this browser only) and the gallery shows the local list. Rules shipped:

- **wishes** (`firestore.rules`): public read; anyone can create a well-formed wish
  (≤60-char name, ≤600-char message, server timestamp); no client edits/deletes —
  moderate via the console.
- **gallery** (`storage.rules`): public read; uploads only via the console. Upload
  photos & videos to a `gallery/` folder — shown sorted by file name, videos get a
  play button + lightbox player.

### Send invitations

Share `https://<your-site>/?to=ឈ្មោះភ្ញៀវ` — Telegram/Messenger URL-encode the Khmer
name automatically when pasting. Without `?to=` the printed name frame stays blank,
just like the physical card.

## Notes

- Music starts only after the guest taps open (browsers require a gesture); the on/off
  choice is remembered per browser.
- Tap any panel to zoom it (lightbox); pinch-zoom also works.
- `prefers-reduced-motion` is respected (no ambient layer, instant reveal).
- Firebase code is lazy-loaded — demo mode never downloads it.
- If the animation is mid-flight when the guest switches tabs, it simply resumes and
  completes when they return.
