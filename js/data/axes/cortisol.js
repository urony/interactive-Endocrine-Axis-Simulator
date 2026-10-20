/* ציר הקורטיזול: היפותלמוס → CRH → יותרת המוח → ACTH → קליפת האדרנל → קורטיזול */
ENDO.registerAxis({
  id: 'cortisol',
  order: 2,
  nameHe: 'ציר הקורטיזול',
  chainHe: 'היפותלמוס ← יותרת המוח ← קליפת האדרנל',
  icon: 'adrenal',
  accent: '#f87171',
  viewBox: [720, 800],

  nodes: {
    hypothalamus: { shape: 'hypothalamus', x: 360, y: 96, labelHe: 'היפותלמוס', label: { dx: -128, dy: -34, anchor: 'end' } },
    pituitary:    { shape: 'pituitary',    x: 360, y: 285, labelHe: 'יותרת המוח', label: { dx: -80, dy: -8, anchor: 'end' } },
    adrenal:      { shape: 'adrenal',      x: 360, y: 486, labelHe: 'קליפת האדרנל', label: { dx: 80, dy: 62, anchor: 'start' }, produces: ['cortisol'] },
    tissues:      { shape: 'body',         x: 360, y: 700, labelHe: 'רקמות הגוף', label: { dx: 64, dy: 14, anchor: 'start' } },
    external:     { x: 96, y: 486, external: true },
  },

  hormones: {
    crh:     { he: 'הורמון משחרר קורטיקוטרופין', abbr: 'CRH', role: 'releasing', color: '#e879f9', shape: 'circle', from: 'hypothalamus' },
    acth:    { he: 'הורמון מגרה קליפת אדרנל', abbr: 'ACTH', role: 'tropic', color: '#fbbf24', shape: 'diamond', from: 'pituitary',
               drivenBy: { pos: ['crh'] } },
    cortisol:{ he: 'קורטיזול (טבעי)', abbr: 'קורטיזול', role: 'end', color: '#f87171', shape: 'triangle', from: 'adrenal',
               drivenBy: { pos: ['acth', 'acth_ect'] } },
    acth_ect:{ he: 'ACTH ממקור חיצוני לציר', abbr: 'ACTH חיצוני', role: 'external', color: '#fb923c', shape: 'diamond', stroke: '#ffffff',
               from: 'external', external: true },
    gc_ext:  { he: 'גלוקוקורטיקואיד ממקור חיצוני', abbr: 'גלוקו׳ חיצוני', role: 'external', color: '#2dd4bf', shape: 'capsule', stroke: '#ffffff',
               from: 'external', external: true },
  },

  flows: [
    { id: 'f_crh',      hormone: 'crh',      from: 'hypothalamus', fromPort: 'b', to: 'pituitary', toPort: 't', chip: { dx: 22, dy: 0 } },
    { id: 'f_acth',     hormone: 'acth',     from: 'pituitary',    fromPort: 'b', to: 'adrenal',   toPort: 't', chip: { dx: 22, dy: 0 } },
    { id: 'f_cortisol', hormone: 'cortisol', from: 'adrenal',      fromPort: 'b', to: 'tissues',   toPort: 't', chip: { dx: 26, dy: 0 } },
    { id: 'f_acth_ect', hormone: 'acth_ect', from: 'external',     fromPort: 'r', to: 'adrenal',   toPort: 'l', chip: { dx: 0, dy: -30 } },
    { id: 'f_gc_ext',   hormone: 'gc_ext',   from: 'external',     fromPort: 'b', to: 'tissues',   toPort: 'l', k: 130, chip: { dx: 0, dy: 40 } },
  ],

  feedback: [
    { id: 'fb_hyp', effects: [{ target: 'crh', sign: '-' }], toNode: 'hypothalamus', toPort: 'r',
      sources: [
        { node: 'adrenal', port: 'r', hormones: ['cortisol'], k: 250 },
        { node: 'external', port: 't', toPort: 'l', hormones: ['gc_ext'], k: 150 },
      ] },
    { id: 'fb_pit', effects: [{ target: 'acth', sign: '-' }], toNode: 'pituitary', toPort: 'r',
      sources: [
        { node: 'adrenal', port: 'r', hormones: ['cortisol'], k: 150 },
        { node: 'external', port: 't', toPort: 'l', hormones: ['gc_ext'], k: 110 },
      ] },
    { id: 'nofb_ext', ghost: true, hormones: ['cortisol'], fromNode: 'adrenal', fromPort: 'b', fromOffset: [-24, 0],
      toNode: 'external', toPort: 'b', k: 120, effects: [{ target: 'acth_ect', sign: '-' }] },
  ],

  introStep: {
    phase: 'normal', dur: 6,
    title: 'ציר תקין',
    text: 'ההיפותלמוס מפריש CRH ← יותרת המוח מפרישה ACTH ← קליפת האדרנל מפרישה קורטיזול. הקורטיזול מעכב בחזרה את ההיפותלמוס ואת יותרת המוח (משוב שלילי).',
    highlight: ['hypothalamus', 'pituitary', 'adrenal'],
  },
});
