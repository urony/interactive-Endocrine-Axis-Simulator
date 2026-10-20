/* ==========================================================================
   app.js — הממשק: מסך בית, בחירת ציר, מצב למידה ומצב אבחון.
   ========================================================================== */
(function () {
  'use strict';

  const E = window.ENDO;
  const Scene = window.ENDO_Scene;
  const Simulator = window.ENDO_Simulator;
  const ILL = window.ENDO_ILLUSTRATIONS;

  const $ = (s, r) => (r || document).querySelector(s);

  const TYPE_HE = {
    normal: 'תקין',
    'primary-hyper': 'ראשוני · יתר-פעילות',
    'secondary-hyper': 'משני · יתר-פעילות',
    'primary-hypo': 'ראשוני · תת-פעילות',
    'secondary-hypo': 'משני · תת-פעילות',
    'tertiary-hypo': 'שלישוני · תת-פעילות',
    resistance: 'עמידות לקולטן',
    ectopic: 'אקטופי',
    exogenous: 'חיצוני (תרופה)',
  };
  const STATE_HE = E.LEVEL_HE;

  const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5l11 7-11 7z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  const ICON_REPLAY = '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const app = {
    axisId: null,
    mode: 'learn',
    diseaseId: 'normal',
    sim: null,
    diag: { current: null, selected: null, answered: false, correct: false, last: null, score: { ok: 0, total: 0 }, n: 0 },
  };

  function h(tag, attrs, kids) {
    const n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'html') n.innerHTML = attrs[k];
        else if (k === 'text') n.textContent = attrs[k];
        else if (k.startsWith('on')) n.addEventListener(k.slice(2), attrs[k]);
        else n.setAttribute(k, attrs[k]);
      });
    }
    (kids || []).forEach((c) => n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return n;
  }

  /* ------------------------------------------------------------------ */
  /* מסך בית                                                            */
  /* ------------------------------------------------------------------ */

  function renderHome() {
    const grid = $('#axis-grid');
    grid.innerHTML = '';
    E.listAxes().forEach((axis) => {
      const ill = ILL[axis.icon];
      const icon = h('div', { class: 'axis-icon', html:
        `<svg viewBox="-110 -90 220 180" aria-hidden="true"><g class="node" data-shape="${axis.icon}"><g class="illus">${ill.svg}</g></g></svg>` });
      const count = axis.diseases.filter((d) => d.type !== 'normal').length;
      const card = h('button', { class: 'axis-card', type: 'button', style: `--accent:${axis.accent}`, onclick: () => openAxis(axis.id, 'learn') }, [
        icon,
        h('div', { class: 'axis-card-body' }, [
          h('h3', { text: axis.nameHe }),
          h('p', { text: axis.chainHe }),
          h('span', { class: 'pill', text: `${count} מצבים קליניים` }),
        ]),
      ]);
      grid.appendChild(card);
    });
  }

  function showScreen(name) {
    $('#home').hidden = name !== 'home';
    $('#axis').hidden = name !== 'axis';
    window.scrollTo(0, 0);
  }

  function goHome() {
    destroySim();
    app.axisId = null;
    history.replaceState(null, '', location.pathname);
    showScreen('home');
  }

  /* ------------------------------------------------------------------ */
  /* מסך ציר                                                            */
  /* ------------------------------------------------------------------ */

  function currentAxis() { return E.getAxis(app.axisId); }

  function openAxis(id, mode) {
    app.axisId = id;
    app.diag = { current: null, selected: null, answered: false, correct: false, last: null, score: { ok: 0, total: 0 }, n: 0 };
    app.diseaseId = 'normal';
    $('#axis-title').textContent = currentAxis().nameHe;
    $('#axis').style.setProperty('--accent', currentAxis().accent);
    showScreen('axis');
    setMode(mode || 'learn');
  }

  function setMode(mode) {
    app.mode = mode;
    history.replaceState(null, '', `#${app.axisId}/${mode}`);
    document.querySelectorAll('.tabs button').forEach((b) => {
      const on = b.dataset.mode === mode;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.classList.toggle('on', on);
    });
    if (mode === 'learn') {
      renderLearnPanel();
      loadSim(E.getDisease(app.axisId, app.diseaseId), true);
    } else {
      // כניסה למצב אבחון תמיד מתחילה ללא מקרה פתוח (הניקוד נשמר)
      Object.assign(app.diag, { current: null, selected: null, answered: false, correct: false });
      renderDiagPanel();
      destroySim();
      prepareDiagStage();
    }
  }

  function destroySim() {
    if (app.sim) { app.sim.destroy(); app.sim = null; }
  }

  /** טוען סימולציה חדשה. guided=false → מצב אבחון (בלי רמזים). */
  function loadSim(disease, guided) {
    destroySim();
    const axis = currentAxis();
    const svg = $('#stage');
    const scene = new Scene(svg, axis);
    buildLevelsPanel(axis);
    app.guided = guided;
    if (!guided) $('#panel-explain').hidden = true; // במצב אבחון אין הסבר עד לשליחת תשובה
    app.sim = new Simulator(scene, disease, {
      guided,
      onStep: handleStep,
      onEnd: () => {},
      onLevels: handleLevels,
      onPlayState: handlePlayState,
    });
    app.sim.setSpeed(parseFloat($('#c-speed').value));
    buildDots();
    syncDots(app.sim.index);
    $('#controls').classList.remove('disabled');
  }

  /** מסך אבחון לפני תחילת מקרה: ציר נקי במצב תקין, בלי אנימציה. */
  function prepareDiagStage() {
    const axis = currentAxis();
    new Scene($('#stage'), axis);
    buildLevelsPanel(axis);
    $('#dots').innerHTML = '';
    $('#stage-badge').textContent = '';
    $('#stage-badge').hidden = true;
    $('#controls').classList.add('disabled');
    $('#c-play').innerHTML = ICON_PLAY;
    $('#panel-explain').hidden = true;
    renderCaption(null, null, null);
  }

  /* ---------- פאנל מצב למידה ---------- */

  function renderLearnPanel() {
    const axis = currentAxis();
    const box = $('#panel-mode');
    box.innerHTML = '';
    box.appendChild(h('h3', { text: 'בחרו מצב קליני' }));
    box.appendChild(h('p', { class: 'hint', text: 'האנימציה תמיד מתחילה מהציר התקין.' }));
    const list = h('div', { class: 'chips', role: 'group', 'aria-label': 'מצבים קליניים' });
    axis.diseases.forEach((d) => {
      const chip = h('button', {
        class: 'chip-btn' + (d.id === app.diseaseId ? ' on' : ''), type: 'button', 'data-id': d.id,
        'aria-pressed': d.id === app.diseaseId ? 'true' : 'false',
        onclick: () => {
          app.diseaseId = d.id;
          list.querySelectorAll('.chip-btn').forEach((c) => {
            const on = c.dataset.id === d.id;
            c.classList.toggle('on', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          loadSim(d, true);
        },
      }, [
        h('span', { class: 'chip-name', text: d.nameHe }),
        h('span', { class: 'chip-tag t-' + d.type, text: TYPE_HE[d.type] || '' }),
      ]);
      list.appendChild(chip);
    });
    box.appendChild(list);
  }

  /* ---------- פאנל מצב אבחון ---------- */

  function renderDiagPanel() {
    const axis = currentAxis();
    const dg = app.diag;
    const box = $('#panel-mode');
    box.innerHTML = '';

    const head = h('div', { class: 'diag-head' }, [
      h('h3', { text: 'אתגר אבחון' }),
      h('span', { class: 'score', text: `נכון ${dg.score.ok} מתוך ${dg.score.total}` }),
    ]);
    box.appendChild(head);

    if (!dg.current) {
      box.appendChild(h('p', { text: 'המערכת תבחר באקראי מצב קליני בציר הזה. לא יוצגו שם המחלה ולא מקום ההפרעה. התבוננו בהורמונים ובמשוב, ובחרו את האבחנה.' }));
      box.appendChild(h('button', { class: 'btn primary wide', type: 'button', onclick: startCase }, ['התחל מקרה']));
      return;
    }

    box.appendChild(h('p', { class: 'hint', text: `מקרה ${dg.n}: מה האבחנה?` }));
    const group = h('div', { class: 'options', role: 'radiogroup', 'aria-label': 'אפשרויות אבחנה' });
    axis.diseases.filter((d) => d.type !== 'normal').forEach((d) => {
      let cls = 'opt';
      if (dg.selected === d.id) cls += ' sel';
      if (dg.answered && d.id === dg.current.id) cls += ' right';
      if (dg.answered && dg.selected === d.id && d.id !== dg.current.id) cls += ' wrong';
      const o = h('button', {
        class: cls, type: 'button', role: 'radio', 'aria-checked': dg.selected === d.id ? 'true' : 'false',
        onclick: () => {
          if (dg.answered) return;
          dg.selected = d.id;
          renderDiagPanel();
        },
      }, [h('span', { class: 'radio-dot' }), h('span', { text: d.nameHe })]);
      if (dg.answered) o.disabled = true;
      group.appendChild(o);
    });
    box.appendChild(group);

    if (!dg.answered) {
      const submit = h('button', { class: 'btn primary wide', type: 'button', onclick: submitAnswer }, ['שלח תשובה']);
      if (!dg.selected) submit.disabled = true;
      box.appendChild(submit);
    } else {
      const chosen = axis.diseases.find((d) => d.id === dg.selected);
      const res = h('div', { class: 'result ' + (dg.correct ? 'ok' : 'bad'), role: 'status' }, [
        h('b', { text: dg.correct ? 'נכון!' : 'לא מדויק' }),
        h('span', { text: dg.correct
          ? `האבחנה: ${dg.current.nameHe}.`
          : `האבחנה הנכונה: ${dg.current.nameHe}. בחרתם: ${chosen.nameHe}.` }),
        h('span', { class: 'sub', text: 'עכשיו האנימציה חוזרת עם סימון מקור ההפרעה וההסבר.' }),
      ]);
      box.appendChild(res);
      box.appendChild(h('div', { class: 'row' }, [
        h('button', { class: 'btn primary', type: 'button', onclick: startCase }, ['מקרה נוסף']),
        h('button', { class: 'btn', type: 'button', onclick: () => app.sim && app.sim.restart() }, ['הפעל שוב']),
      ]));
    }
  }

  function startCase() {
    const axis = currentAxis();
    const dg = app.diag;
    const pool = axis.diseases.filter((d) => d.type !== 'normal' && d.id !== dg.last);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    dg.current = pick;
    dg.last = pick.id;
    dg.selected = null;
    dg.answered = false;
    dg.correct = false;
    dg.n += 1;
    renderDiagPanel();
    loadSim(pick, false);
  }

  function submitAnswer() {
    const dg = app.diag;
    if (!dg.selected || dg.answered) return;
    dg.answered = true;
    dg.correct = dg.selected === dg.current.id;
    dg.score.total += 1;
    if (dg.correct) dg.score.ok += 1;
    renderDiagPanel();
    loadSim(dg.current, true); // חשיפה: אותה הגדרת מחלה, בתצוגה מונחית
    showExplanation(dg.current);
  }

  /* ---------- כיתוב, כפתורי שלבים, רמות ---------- */

  function renderCaption(i, step, sim) {
    const box = $('#panel-caption');
    box.innerHTML = '';
    if (!sim) {
      box.appendChild(h('div', { class: 'cap-step', text: app.mode === 'diag' ? 'מוכנים?' : '' }));
      box.appendChild(h('p', { text: app.mode === 'diag'
        ? 'לחצו על "התחל מקרה". הציר יוצג תחילה במצב תקין, ולאחר מכן תתחיל להשתנות. אין כיתובים, כדי שתוכלו לאבחן בעצמכם.'
        : '' }));
      return;
    }
    if (app.guided) {
      box.appendChild(h('div', { class: 'cap-step', text: `שלב ${i + 1} מתוך ${sim.stepCount}` }));
      box.appendChild(h('h3', { class: 'ph-' + step.phase, text: step.title }));
      box.appendChild(h('p', { text: step.text }));
    } else {
      box.appendChild(h('div', { class: 'cap-step', text: 'צופים במקרה' }));
      box.appendChild(h('h3', { class: 'ph-' + step.phase, text: E.PHASE_NEUTRAL_HE[step.phase] }));
      box.appendChild(h('p', { text: 'שימו לב לשבבי הרמה, לתנועת ההורמונים ולחצי המשוב: מה עולה, מה יורד, ומה קורה למשוב?' }));
    }
  }

  function handleStep(i, step, sim) {
    renderCaption(i, step, sim);
    const badge = $('#stage-badge');
    badge.hidden = false;
    badge.textContent = app.guided ? step.title : E.PHASE_NEUTRAL_HE[step.phase];
    badge.className = 'stage-badge ph-' + step.phase;
    syncDots(i);
    $('#c-prev').disabled = i === 0;
    $('#c-next').disabled = i === sim.stepCount - 1;
    // הסבר מלא: בשלב האחרון של מצב למידה (בחשיפת אבחון הוא כבר מוצג)
    if (app.guided && i === sim.stepCount - 1) showExplanation(sim.disease);
    else if (app.mode === 'learn') $('#panel-explain').hidden = true;
  }

  function syncDots(i) {
    document.querySelectorAll('#dots .dot').forEach((d, k) => {
      d.classList.toggle('on', k === i);
      d.classList.toggle('done', k < i);
    });
  }

  function showExplanation(disease) {
    const ex = disease.explanation;
    const box = $('#panel-explain');
    if (!ex) { box.hidden = true; return; }
    box.innerHTML = '';
    box.appendChild(h('h3', { text: 'סיכום: ' + disease.nameHe }));
    [['מה קרה?', ex.mechanism], ['מה קורה למשוב?', ex.feedback], ['איך מזהים?', ex.note]].forEach(([t, body]) => {
      box.appendChild(h('div', { class: 'ex-row' }, [h('b', { text: t }), h('p', { text: body })]));
    });
    box.hidden = false;
  }

  function buildDots() {
    const dots = $('#dots');
    dots.innerHTML = '';
    for (let i = 0; i < app.sim.stepCount; i++) {
      dots.appendChild(h('button', {
        class: 'dot', type: 'button', 'aria-label': `מעבר לשלב ${i + 1}`,
        onclick: () => { app.sim.ended = false; app.sim.goto(i, app.sim.paused); },
      }));
    }
  }

  function handlePlayState(sim) {
    const b = $('#c-play');
    if (sim.ended) { b.innerHTML = ICON_REPLAY; b.setAttribute('aria-label', 'הפעלה חוזרת'); }
    else if (sim.paused) { b.innerHTML = ICON_PLAY; b.setAttribute('aria-label', 'הפעלה'); }
    else { b.innerHTML = ICON_PAUSE; b.setAttribute('aria-label', 'השהיה'); }
  }

  function buildLevelsPanel(axis) {
    const box = $('#panel-levels');
    box.innerHTML = '';
    box.appendChild(h('h3', { text: 'רמות ההורמונים' }));
    const list = h('div', { class: 'levels' });
    Object.keys(axis.hormones).forEach((id) => {
      const hm = axis.hormones[id];
      const glyph = h('span', { class: 'glyph', html:
        `<svg viewBox="-12 -12 24 24" width="26" height="26" aria-hidden="true"><use href="#p-${hm.shape}" fill="${hm.color}" stroke="${hm.stroke || (hm.shape === 'antibody' ? hm.color : 'rgba(255,255,255,.55)')}" stroke-width="${hm.stroke ? 1.5 : 0.8}"/></svg>` });
      const row = h('div', { class: 'level-row' + (hm.external ? ' ext' : ''), 'data-h': id, 'data-state': hm.external ? 'none' : 'normal' }, [
        glyph,
        h('div', { class: 'lv-name' }, [h('b', { text: hm.abbr }), h('span', { text: hm.he })]),
        h('span', { class: 'lv-pill', text: hm.external ? '' : STATE_HE.normal }),
      ]);
      list.appendChild(row);
    });
    box.appendChild(list);
  }

  function handleLevels(states) {
    Object.keys(states).forEach((id) => {
      const row = document.querySelector(`.level-row[data-h="${id}"]`);
      if (!row) return;
      const s = states[id];
      row.setAttribute('data-state', s);
      row.querySelector('.lv-pill').textContent = STATE_HE[s] || '';
    });
  }

  /* ------------------------------------------------------------------ */
  /* אירועים                                                            */
  /* ------------------------------------------------------------------ */

  function bind() {
    $('#btn-home').addEventListener('click', goHome);
    $('#btn-back').addEventListener('click', goHome);
    document.querySelectorAll('.tabs button').forEach((b) => {
      b.addEventListener('click', () => { if (app.axisId) setMode(b.dataset.mode); });
    });
    $('#c-play').addEventListener('click', () => app.sim && app.sim.toggle());
    $('#c-restart').addEventListener('click', () => app.sim && app.sim.restart());
    $('#c-prev').addEventListener('click', () => app.sim && app.sim.prev());
    $('#c-next').addEventListener('click', () => app.sim && app.sim.next());
    $('#c-speed').addEventListener('change', (e) => app.sim && app.sim.setSpeed(parseFloat(e.target.value)));
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && app.sim && !/^(BUTTON|SELECT|INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault();
        app.sim.toggle();
      }
    });
  }

  function init() {
    renderHome();
    bind();
    const m = location.hash.match(/^#([\w-]+)\/(learn|diag)$/);
    if (m && E.getAxis(m[1])) openAxis(m[1], m[2]);
    else showScreen('home');
  }

  window.ENDO_APP = app; // לצורכי בדיקות ודיבוג
  init();
})();
