// ============================================================================
//  ការកំណត់ — EDIT HERE
//  The invitation text itself lives in the printed artwork (public/assets/card/),
//  cropped from the original design proofs in design/originals/ by
//  scripts/crop-cards.mjs. This file holds everything around it.
// ============================================================================

// ---------------------------------------------------------------------------
// FIREBASE — paste your web-app config here to go live.
// While this is null the site runs in "demo mode":
//   · wishes are stored in this browser only (localStorage)
//   · the gallery shows the local placeholder list below
// Firebase console → Project settings → Your apps → Web app → Config
// ---------------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: 'AIzaSyD_k02Omgrtnng-O9XywjXGQybrcJWT6q0',
  authDomain: 'vl-wedding.firebaseapp.com',
  projectId: 'vl-wedding',
  storageBucket: 'vl-wedding.firebasestorage.app',
  messagingSenderId: '214109965184',
  appId: '1:214109965184:web:b56363c840b2bc067f4f65',
  measurementId: 'G-GJDKW29398',
}

// ---------------------------------------------------------------------------
export const couple = {
  groom: { kh: 'ខូវ ទី វិកទ័រ', en: 'Victor' },
  bride: { kh: 'និត លុចលក្ខណា', en: 'Lakna' },
}

export const event = {
  dateISO: '2026-11-04T17:00:00+07:00',
  endISO: '2026-11-04T21:00:00+07:00',
  dayEn: 'Wednesday, 04th November 2026',
  timeEn: 'at 5:00 p.m.',
  venueEn: 'Sokha Phnom Penh Hotel & Residence · Chroy Changvar, Phnom Penh',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Sokha+Phnom+Penh+Hotel+%26+Residence',
}

// ---------------------------------------------------------------------------
// The real artwork, cropped from the print proofs.
// guestBox positions the guest's name inside the empty frame printed on the
// front cover (percentages of the cover image).
// ---------------------------------------------------------------------------
export const art = {
  coverFront: { src: '/assets/card/cover-front.jpg', alt: 'សិរីមង្គលអាពាហ៍ពិពាហ៍ — គម្របលិខិតអញ្ជើញ' },
  coverBack: { src: '/assets/card/cover-back.jpg', alt: 'ក្របខាងក្រោយ' },
  badge: { src: '/assets/card/badge.png', alt: 'ត្រាសញ្ញា' },
  crest: { src: '/assets/card/crest.png', alt: 'សញ្ញាគូស្វាមីភរិយា' },
  invite: { src: '/assets/card/panel-invite.jpg', alt: 'លិខិតអញ្ជើញអាពាហ៍ពិពាហ៍ ខូវ ទី វិកទ័រ & និត លុចលក្ខណា — ថ្ងៃពុធ ទី០៤ ខែវិច្ឆិកា ឆ្នាំ២០២៦ វេលាម៉ោង ៥:០០ល្ងាច នៅសណ្ឋាគារ សុខា ភ្នំពេញ' },
  letter: { src: '/assets/card/letter-procession.jpg', alt: 'លិខិតអញ្ជើញហែជំនូន — ម៉ោង ០៦:៣០ព្រឹក ថ្ងៃទី០៤ ខែវិច្ឆិកា ឆ្នាំ២០២៦' },
  agenda: { src: '/assets/card/panel-agenda.jpg', alt: 'កម្មវិធីសិរីមង្គលអាពាហ៍ពិពាហ៍ ថ្ងៃទី០៣-០៤ ខែវិច្ឆិកា ឆ្នាំ២០២៦' },
  thanks: { src: '/assets/card/panel-thanks.jpg', alt: 'សេចក្តីថ្លែងអំណរគុណ និងសេចក្តីសុំអភ័យទោស' },
  mapCard: { src: '/assets/card/map-card.jpg', alt: 'ផែនទីទៅសណ្ឋាគារ សុខា ភ្នំពេញ (ជ្រោយចង្វារ)' },
  guestFrame: { src: '/assets/card/guest-frame.png', alt: '' },
  guestBox: { left: 22.2, top: 72.05, width: 53.2, height: 5.2 },
}

// ---------------------------------------------------------------------------
export const sections = {
  procession: { kh: 'លិខិតអញ្ជើញហែជំនូន', en: 'Gift Procession' },
  agenda: { kh: 'កម្មវិធីសិរីមង្គលអាពាហ៍ពិពាហ៍', en: 'Wedding Programme' },
  thanks: { kh: 'សេចក្តីថ្លែងអំណរគុណ', en: 'With Gratitude' },
  location: { kh: 'ទីតាំងកម្មវិធី', en: 'Location' },
  gallery: { kh: 'កម្រងអនុស្សាវរីយ៍', en: 'Pre-Wedding Gallery' },
  wishes: { kh: 'ពាក្យជូនពរ', en: 'Wishes & Blessings' },
}

// ---------------------------------------------------------------------------
// GALLERY — with Firebase configured, files are read from Storage under
// `storagePath` (images + videos, sorted by file name). Until then the local
// list below is shown. Drop real photos into /public/assets/gallery/.
// ---------------------------------------------------------------------------
export const gallery = {
  storagePath: 'gallery',
  local: [
    { type: 'image', src: '/assets/gallery/photo-1.svg', caption: '' },
    { type: 'image', src: '/assets/gallery/photo-2.svg', caption: '' },
    { type: 'image', src: '/assets/gallery/photo-3.svg', caption: '' },
    { type: 'image', src: '/assets/gallery/photo-4.svg', caption: '' },
    { type: 'image', src: '/assets/gallery/photo-5.svg', caption: '' },
    { type: 'image', src: '/assets/gallery/photo-6.svg', caption: '' },
  ],
}

// ---------------------------------------------------------------------------
export const wishes = {
  messagePlaceholder: 'សរសេរពាក្យជូនពរ ដល់ វិកទ័រ & លក្ខណា ...',
  submitLabel: 'ផ្ញើពាក្យជូនពរ',
  emptyLabel: 'ក្លាយជាអ្នកដំបូង ដែលផ្ញើពាក្យជូនពរ',
  demoSeed: [
    { name: 'គ្រួសារ អ៊ុំ សុខា', message: 'សូមជូនពរឱ្យកូនទាំងពីរ មានសុភមង្គលក្នុងជីវិតគូ ស្រឡាញ់គ្នាយូរអង្វែង រហូតចាស់ដល់ក្ស័យ។' },
    { name: 'Dara & Family', message: 'Congratulations Victor & Luxlakna! Wishing you a lifetime of love and happiness.' },
    { name: 'មិត្តរួមការងារ', message: 'អបអរសាទរ! សូមឱ្យអាពាហ៍ពិពាហ៍នេះ ពោរពេញដោយក្តីស្រឡាញ់ និងសំណាងល្អគ្រប់ពេលវេលា។' },
  ],
}

// ---------------------------------------------------------------------------
// MUSIC — drop your song at public/assets/music/song.mp3 and it plays.
// While the file is missing, the built-in music-box rendition of Pachelbel's
// Canon in D plays instead (automatic fallback).
// ---------------------------------------------------------------------------
export const music = {
  url: '/assets/music/song.mp3',
}

// ---------------------------------------------------------------------------
export const misc = {
  // shown when the link has no ?to= name of its own
  defaultGuest: 'លោក និត លុចវីរៈបុត្រ',
  guestPrefix: 'ជូនចំពោះ',
  guestLabel: 'សូមគោរពអញ្ជើញ',
  openButton: 'បើកលិខិតអញ្ជើញ',
  countdownTitle: 'រាប់ថយក្រោយ ដល់ថ្ងៃមង្គល',
  countdownDone: 'អរគុណសម្រាប់ការចូលរួម ជាមួយគ្រួសារយើងខ្ញុំ',
  scrollHint: 'អូសចុះក្រោម',
  mapButton: 'បើកផែនទី Google Maps',
  gcalButton: 'រក្សាទុកកាលបរិច្ឆេទ',
  footerLine: 'រៀបចំដោយក្តីស្រឡាញ់ · Victor & Lakna · 04.11.2026',
}
