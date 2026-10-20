/* ציר הורמון הגדילה: היפותלמוס → GHRH / סומטוסטטין → יותרת המוח → GH → כבד ורקמות → IGF-1 */
ENDO.registerAxis({
  id: 'gh',
  order: 3,
  nameHe: 'ציר הורמון הגדילה',
  chainHe: 'היפותלמוס ← יותרת המוח ← כבד ורקמות',
  icon: 'bone',
  accent: '#38bdf8',
  viewBox: [720, 800],

  nodes: {
    hypothalamus: { shape: 'hypothalamus', x: 400, y: 96, labelHe: 'היפותלמוס', label: { dx: 126, dy: -34, anchor: 'start' } },
    pituitary:    { shape: 'pituitary',    x: 400, y: 290, labelHe: 'יותרת המוח', label: { dx: 80, dy: -22, anchor: 'start' } },
    liver:        { shape: 'liver',        x: 230, y: 520, labelHe: 'כבד', label: { dx: 0, dy: 70, anchor: 'middle' }, produces: ['igf1'] },
    tissues:      { shape: 'bone',         x: 570, y: 520, labelHe: 'עצמות ושרירים', label: { dx: 0, dy: 62, anchor: 'middle' } },
  },

  hormones: {
    ghrh: { he: 'הורמון משחרר הורמון גדילה', abbr: 'GHRH', role: 'releasing', color: '#2dd4bf', shape: 'circle', from: 'hypothalamus' },
    ss:   { he: 'סומטוסטטין (GHIH)', abbr: 'סומטוסטטין', role: 'inhibiting', color: '#cbd5e1', shape: 'square', from: 'hypothalamus' },
    gh:   { he: 'הורמון גדילה', abbr: 'GH', role: 'tropic', color: '#38bdf8', shape: 'diamond', from: 'pituitary',
            drivenBy: { pos: ['ghrh'], neg: ['ss'] } },
    igf1: { he: 'גורם גדילה דמוי אינסולין 1', abbr: 'IGF-1', role: 'mediator', color: '#a3e635', shape: 'hexagon', from: 'liver',
            drivenBy: { pos: ['gh'] } },
  },

  flows: [
    { id: 'f_ghrh', hormone: 'ghrh', from: 'hypothalamus', fromPort: 'b', fromOffset: [-26, 0], to: 'pituitary', toPort: 't', toOffset: [-26, 0], chip: { dx: -24, dy: 0 } },
    { id: 'f_ss',   hormone: 'ss',   from: 'hypothalamus', fromPort: 'b', fromOffset: [26, 0],  to: 'pituitary', toPort: 't', toOffset: [26, 0],  chip: { dx: 24, dy: 0 } },
    { id: 'f_gh_liver',   hormone: 'gh', from: 'pituitary', fromPort: 'b', fromOffset: [-10, 0], to: 'liver',   toPort: 't', k: 70, chip: { dx: -24, dy: 6 } },
    { id: 'f_gh_tissues', hormone: 'gh', from: 'pituitary', fromPort: 'b', fromOffset: [10, 0],  to: 'tissues', toPort: 't', k: 70, chip: false },
    { id: 'f_igf1', hormone: 'igf1', from: 'liver', fromPort: 'r', to: 'tissues', toPort: 'l', k: 60, chip: { dx: 0, dy: -30 } },
  ],

  feedback: [
    { id: 'fb_hyp', effects: [{ target: 'ghrh', sign: '-' }], toNode: 'hypothalamus', toPort: 'l',
      sources: [{ node: 'liver', port: 'l', hormones: ['igf1'], k: 150 }] },
    { id: 'fb_pit', effects: [{ target: 'gh', sign: '-' }], toNode: 'pituitary', toPort: 'l',
      sources: [{ node: 'liver', port: 'l', fromOffset: [0, 26], hormones: ['igf1'], k: 90 }] },
  ],

  introStep: {
    phase: 'normal', dur: 6,
    title: 'ציר תקין',
    text: 'ההיפותלמוס מפריש GHRH (מגרה) וסומטוסטטין (מעכב) ← יותרת המוח מפרישה GH ← ה-GH פועל על הכבד והרקמות, והכבד מפריש IGF-1. IGF-1 מעכב בחזרה את GHRH ואת הפרשת ה-GH מיותרת המוח.',
    highlight: ['hypothalamus', 'pituitary', 'liver'],
  },
});
