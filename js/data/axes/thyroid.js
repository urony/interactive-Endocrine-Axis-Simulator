/* ציר בלוטת התריס: היפותלמוס → TRH → יותרת המוח → TSH → בלוטת התריס → T3/T4 */
ENDO.registerAxis({
  id: 'thyroid',
  order: 1,
  nameHe: 'ציר בלוטת התריס',
  chainHe: 'היפותלמוס ← יותרת המוח ← בלוטת התריס',
  icon: 'thyroid',
  accent: '#22c55e',
  viewBox: [720, 800],

  nodes: {
    hypothalamus: { shape: 'hypothalamus', x: 360, y: 96, labelHe: 'היפותלמוס', label: { dx: -128, dy: -34, anchor: 'end' } },
    pituitary:    { shape: 'pituitary',    x: 360, y: 285, labelHe: 'יותרת המוח', label: { dx: -80, dy: -8, anchor: 'end' } },
    thyroid:      { shape: 'thyroid',      x: 360, y: 490, labelHe: 'בלוטת התריס', label: { dx: 92, dy: 70, anchor: 'start' }, produces: ['t3t4'] },
    tissues:      { shape: 'body',         x: 360, y: 690, labelHe: 'רקמות הגוף', label: { dx: 64, dy: 14, anchor: 'start' } },
    external:     { x: 96, y: 490, external: true },
  },

  hormones: {
    trh:  { he: 'הורמון משחרר תירוטרופין', abbr: 'TRH', role: 'releasing', color: '#a78bfa', shape: 'circle', from: 'hypothalamus', produces: true },
    tsh:  { he: 'הורמון מגרה בלוטת תריס', abbr: 'TSH', role: 'tropic', color: '#60a5fa', shape: 'diamond', from: 'pituitary',
            drivenBy: { pos: ['trh'] } },
    t3t4: { he: 'הורמוני בלוטת התריס', abbr: 'T3/T4', role: 'end', color: '#34d399', shape: 'triangle', from: 'thyroid',
            drivenBy: { pos: ['tsh', 'trab'] } },
    trab: { he: 'נוגדנים מגרים לקולטן ל-TSH', abbr: 'TRAb', role: 'external', color: '#f472b6', shape: 'antibody', from: 'external', external: true },
  },

  flows: [
    { id: 'f_trh',  hormone: 'trh',  from: 'hypothalamus', fromPort: 'b', to: 'pituitary', toPort: 't', chip: { dx: 22, dy: 0 } },
    { id: 'f_tsh',  hormone: 'tsh',  from: 'pituitary',    fromPort: 'b', to: 'thyroid',   toPort: 't', chip: { dx: 22, dy: 0 } },
    { id: 'f_t3t4', hormone: 't3t4', from: 'thyroid',      fromPort: 'b', to: 'tissues',   toPort: 't', chip: { dx: 24, dy: 0 } },
    { id: 'f_trab', hormone: 'trab', from: 'external',     fromPort: 'r', to: 'thyroid',   toPort: 'l', chip: { dx: 0, dy: -28 } },
  ],

  feedback: [
    { id: 'fb_hyp', effects: [{ target: 'trh', sign: '-' }], toNode: 'hypothalamus', toPort: 'r',
      sources: [{ node: 'thyroid', port: 'r', hormones: ['t3t4'], k: 250 }] },
    { id: 'fb_pit', effects: [{ target: 'tsh', sign: '-' }], toNode: 'pituitary', toPort: 'r',
      sources: [{ node: 'thyroid', port: 'r', hormones: ['t3t4'], k: 150 }] },
    // קשת "אין משוב" — מופיעה רק כשמחלה מסמנת אותה כחסומה
    { id: 'nofb_ext', ghost: true, hormones: ['t3t4'], fromNode: 'thyroid', fromPort: 'b', toNode: 'external', toPort: 'b', k: 130,
      effects: [{ target: 'trab', sign: '-' }] },
  ],

  introStep: {
    phase: 'normal', dur: 6,
    title: 'ציר תקין',
    text: 'ההיפותלמוס מפריש TRH ← יותרת המוח מפרישה TSH ← בלוטת התריס מפרישה T3/T4. T3/T4 מעכבות בחזרה את ההיפותלמוס ואת יותרת המוח (משוב שלילי), וכך הרמות נשארות מאוזנות.',
    highlight: ['hypothalamus', 'pituitary', 'thyroid'],
  },
});
