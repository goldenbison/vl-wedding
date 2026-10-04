// Two vowel signs in legacy សុី produce a dotted circle on iOS.
// Use TRIISAP + vowel for this specific sequence; never guess other shifters.
export const normalizeKhmerName = name => name.replace(/\u179f\u17bb\u17b8/g, '\u179f\u17ca\u17b8')
