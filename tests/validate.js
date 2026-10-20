/* בדיקת עקביות פיזיולוגית ומבנית של כל הצירים והמחלות.
   הרצה:  node tests/validate.js
   הבדיקה מוודאת שהרמות הסופיות של כל מחלה עקביות עם מנגנון הציר:
   (1) כל שלב מגרה את הבא אחריו, אלא אם המחלה מצהירה שההפרשה אוטונומית/פגועה.
   (2) משוב: רמה גבוהה של ההורמון המשפיע מורידה את היעד, וההפך — אלא אם הקשת חסומה. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
function load(rel) {
  vm.runInThisContext(fs.readFileSync(path.join(root, rel), 'utf8'), { filename: rel });
}
function walk(dir) {
  return fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith('.js')).sort().map((f) => path.join(dir, f));
}

load('js/core.js');
walk('js/data/axes').forEach(load);
walk('js/data/diseases').forEach(load);

const E = globalThis.ENDO;
const V = E.LEVEL_VALUE;
const PHASES = ['normal', 'disturbance', 'response', 'final'];
let errors = 0;
let checks = 0;

function fail(msg) { errors++; console.error('  ✗ ' + msg); }
function ok() { checks++; }

function num(levels, h) { return V[levels[h]] ?? 0; }
function maxOf(levels, list) { return Math.max(0, ...list.map((h) => num(levels, h))); }

/** ההנעה של הורמון = הגירוי המעודד פחות העיכוב. */
function drive(levels, spec) {
  let d = maxOf(levels, spec.pos || []);
  if (spec.neg && spec.neg.length) d -= maxOf(levels, spec.neg) - V.normal;
  return d;
}

E.listAxes().forEach((axis) => {
  console.log('\nציר: ' + axis.nameHe);
  const base = E.baseLevels(axis);

  // מצב תקין של הציר
  Object.keys(axis.hormones).forEach((h) => {
    const exp = axis.hormones[h].external ? 'none' : 'normal';
    base[h] === exp ? ok() : fail(`מצב התחלתי של ${h} אינו ${exp}`);
  });
  if (!axis.introStep) fail('חסר introStep');

  // הפניות פנימיות בציר
  Object.values(axis.hormones).forEach((hm) => {
    if (!axis.nodes[hm.from]) fail(`הורמון ${hm.abbr}: צומת מקור לא קיים (${hm.from})`);
  });
  axis.flows.forEach((f) => {
    if (!axis.hormones[f.hormone]) fail(`זרימה ${f.id}: הורמון לא קיים`);
    if (!axis.nodes[f.from] || !axis.nodes[f.to]) fail(`זרימה ${f.id}: צומת לא קיים`);
  });
  const fbIds = new Set(axis.feedback.map((f) => f.id));

  // הפיכת הכללים הקדמיים (נקבעו בהורמונים) לבדיקה
  const normalSet = new Set(axis.diseases.filter((d) => d.type === 'normal'));
  if (normalSet.size !== 1) fail('נדרשת בדיוק מחלה אחת מסוג normal');

  axis.diseases.forEach((d) => {
    console.log('  • ' + d.nameHe);
    const steps = E.stepsOf(axis, d);
    const st = E.stateAt(axis, d, steps.length - 1);
    const L = st.levels;

    // מבנה השלבים
    steps.forEach((s, i) => {
      if (!PHASES.includes(s.phase)) fail(`שלב ${i}: phase לא תקין`);
      Object.keys(s.levels || {}).forEach((h) => { if (!axis.hormones[h]) fail(`שלב ${i}: הורמון לא קיים ${h}`); });
      (s.highlight || []).concat(s.show || [], Object.keys(s.status || {})).forEach((n) => {
        if (!axis.nodes[n]) fail(`שלב ${i}: צומת לא קיים ${n}`);
      });
      (s.blocked || []).forEach((b) => {
        const ghost = axis.feedback.find((f) => f.id === b && f.ghost);
        if (!fbIds.has(b)) fail(`שלב ${i}: קשת משוב לא קיימת ${b}`);
        else if (ghost && !axis.nodes.external) fail('קשת ghost ללא צומת חיצוני');
      });
      if (!s.title || !s.text) fail(`שלב ${i}: חסר כותרת/טקסט`);
    });
    if (steps[0].phase !== 'normal') fail('האנימציה אינה מתחילה במצב תקין');
    if (d.type !== 'normal') {
      if (!steps.some((s) => s.phase === 'disturbance')) fail('חסר שלב disturbance');
      if (steps[steps.length - 1].phase !== 'final') fail('השלב האחרון אינו final');
      if (!d.explanation) fail('חסר הסבר');
    }

    // הרמות המצטברות שוות להצהרת final
    Object.keys(axis.hormones).forEach((h) => {
      const exp = d.final[h] || (axis.hormones[h].external ? 'none' : undefined);
      if (exp === undefined) { fail(`final לא מגדיר את ${h}`); return; }
      L[h] === exp ? ok() : fail(`final של ${h}: הוצהר ${exp}, בפועל מהשלבים ${L[h]}`);
    });

    // הורמונים חיצוניים
    Object.keys(axis.hormones).forEach((h) => {
      if (!axis.hormones[h].external || L[h] === 'none') return;
      if (!d.external) fail(`${h} פעיל אך למחלה אין הגדרת external`);
      if (!st.shown.has('external')) fail(`${h} פעיל אך הצומת החיצוני לא מוצג`);
    });
    if (d.external && !I_has(d.external.shape)) fail('צורת מקור חיצוני לא קיימת: ' + d.external.shape);

    // כללי "כל שלב מגרה את הבא"
    Object.keys(axis.hormones).forEach((h) => {
      const hm = axis.hormones[h];
      if (!hm.drivenBy) return;
      const override = (d.forwardOverrides || {})[h];
      const dr = drive(L, hm.drivenBy);
      const expected = E.levelState(dr);
      if (override) { ok(); return; }
      L[h] === expected ? ok() : fail(`${hm.abbr} אמור להיות ${expected} (לפי הגירוי שמעליו) אך הוגדר ${L[h]}. נדרש forwardOverrides?`);
    });

    // כללי משוב
    axis.feedback.forEach((fb) => {
      if (fb.ghost) return;
      if (st.blocked.has(fb.id)) { ok(); return; }
      if (d.consistencyOverrides && d.consistencyOverrides[fb.id]) { ok(); return; }
      const sig = Math.max(...fb.sources.map((s) => maxOf(L, s.hormones)));
      const sigState = E.levelState(sig);
      fb.effects.forEach((ef) => {
        let expected = sigState;
        if (ef.sign === '-') expected = sigState === 'high' ? 'low' : sigState === 'low' ? 'high' : 'normal';
        L[ef.target] === expected
          ? ok()
          : fail(`משוב ${fb.id}: אות ${sigState} אמור להביא ${ef.target} ל-${expected}, אך הוגדר ${L[ef.target]}. נדרש blocked/consistencyOverrides?`);
      });
    });
  });
});

function I_has(shape) {
  const src = fs.readFileSync(path.join(root, 'js/illustrations.js'), 'utf8');
  return new RegExp('I\\.' + shape + '\\s*=').test(src);
}

console.log(`\n${checks} בדיקות עברו, ${errors} כשלים.`);
process.exit(errors ? 1 : 0);
