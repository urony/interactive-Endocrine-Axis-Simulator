/* ==========================================================================
   simulator.js — מנוע האנימציה.
   קורא הגדרת מחלה (נתונים בלבד) ומפעיל: רמות הורמונים מתמצעות בחלקות, חלקיקים
   שתדירותם תלויה ברמה, קשתות משוב, סימון מקור ההפרעה, ורצף שלבים עם בקרת ניגון.
   guided=true: מצב למידה / חשיפת תשובה (מציג מקור, פתולוגיה וכיתובים).
   guided=false: מצב אבחון (אין הדגשות, אין שינוי מבני באיברים, מקור חיצוני ניטרלי).
   ========================================================================== */
(function (root) {
  'use strict';

  const E = root.ENDO;
  const el = root.ENDO_el;
  const MAX_PARTICLES = 150;
  const PARTICLE_SPEED = 130; // פיקסלים בשנייה בקצב 1x
  const MIN_TRAVEL = 1.7;     // זמן מעבר מינימלי (שניות), כדי שגם בנתיבים קצרים יראו כמה חלקיקים

  class Simulator {
    /**
     * @param scene  Scene שנבנה עבור הציר
     * @param disease הגדרת המחלה
     * @param opts { guided, onStep(i, step, sim), onEnd(sim), onLevels(states, sim) }
     */
    constructor(scene, disease, opts) {
      this.scene = scene;
      this.axis = scene.axis;
      this.disease = disease;
      this.opts = opts || {};
      this.guided = !!this.opts.guided;
      this.steps = E.stepsOf(this.axis, disease);
      this.speed = 1;
      this.paused = false;
      this.ended = false;
      this.index = -1;
      this.elapsed = 0;
      this.particles = [];
      this.lastStates = {};
      this.destroyed = false;
      this.raf = 0;

      const base = E.baseLevels(this.axis);
      this.current = {};
      Object.keys(base).forEach((h) => { this.current[h] = E.LEVEL_VALUE[base[h]]; });
      this.target = Object.assign({}, this.current);
      this.fbBlocked = new Set();
      this.edges = scene.edges;
      this.edges.forEach((e) => { e.acc = Math.random(); e.strength = 0; e.vis = 1; });

      this.goto(0, true);
      this.last = performance.now();
      const loop = (now) => {
        if (this.destroyed) return;
        const dt = Math.min(0.05, (now - this.last) / 1000);
        this.last = now;
        this.update(dt);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    /* ---------- בקרה ---------- */

    get stepCount() { return this.steps.length; }
    get step() { return this.steps[this.index]; }

    setSpeed(v) { this.speed = v; }
    pause() { this.paused = true; this.emitPlayState(); }
    play() {
      if (this.ended) { this.restart(); return; }
      this.paused = false; this.emitPlayState();
    }
    toggle() { this.paused ? this.play() : this.pause(); }
    restart() {
      this.clearParticles();
      this.ended = false;
      this.paused = false;
      const base = E.baseLevels(this.axis);
      Object.keys(base).forEach((h) => { this.current[h] = E.LEVEL_VALUE[base[h]]; });
      this.goto(0, true);
    }
    next() { if (this.index < this.steps.length - 1) { this.ended = false; this.goto(this.index + 1, this.paused); } }
    prev() { if (this.index > 0) { this.ended = false; this.goto(this.index - 1, this.paused); } }

    /** מעבר לשלב i. instant: הרמות קופצות מיד (בלי החלקה). */
    goto(i, instant) {
      this.index = i;
      this.elapsed = 0;
      const st = E.stateAt(this.axis, this.disease, i);
      Object.keys(st.levels).forEach((h) => {
        this.target[h] = E.LEVEL_VALUE[st.levels[h]];
        if (instant) this.current[h] = this.target[h];
      });
      this.fbBlocked = st.blocked;
      this.applyNodes(st);
      if (this.opts.onStep) this.opts.onStep(i, this.steps[i], this);
      this.emitPlayState();
    }

    emitPlayState() { if (this.opts.onPlayState) this.opts.onPlayState(this); }

    applyNodes(st) {
      const { scene, axis } = this;
      const step = this.steps[this.index];
      // מקור חיצוני
      if (axis.nodes.external) {
        const ext = scene.nodeEls.external;
        if (st.shown.has('external')) {
          const d = this.disease.external;
          if (d) {
            if (this.guided) scene.setExternal(d.shape, d.labelHe);
            else scene.setExternal('unknown', 'מקור חיצוני לציר');
          }
          ext.g.classList.remove('hidden');
        } else {
          ext.g.classList.add('hidden');
        }
      }
      // מצבי איברים והדגשות — רק במצב מונחה
      Object.keys(axis.nodes).forEach((id) => {
        const { g } = scene.nodeEls[id];
        const status = this.guided ? st.status[id] || 'normal' : 'normal';
        g.setAttribute('data-status', status);
        g.classList.toggle('hl', this.guided && (step.highlight || []).includes(id));
      });
    }

    clearParticles() {
      this.particles.forEach((p) => p.use.remove());
      this.particles = [];
    }

    destroy() {
      this.destroyed = true;
      cancelAnimationFrame(this.raf);
      this.clearParticles();
    }

    /* ---------- עדכון בכל פריים ---------- */

    update(dt) {
      const sdt = this.paused ? 0 : dt * this.speed;

      if (sdt > 0) {
        // התקדמות ציר הזמן
        if (!this.ended) {
          this.elapsed += sdt;
          const dur = this.step.dur || 6;
          if (this.elapsed >= dur) {
            if (this.index < this.steps.length - 1) this.goto(this.index + 1, false);
            else { this.ended = true; this.emitPlayState(); if (this.opts.onEnd) this.opts.onEnd(this); }
          }
        }
        // החלקת רמות
        const k = 1 - Math.exp(-sdt * 1.5);
        Object.keys(this.current).forEach((h) => {
          this.current[h] += (this.target[h] - this.current[h]) * k;
        });
      }

      this.renderEdges(sdt);
      this.renderChips();
      this.renderNodeGlow();
      this.emitLevels();
    }

    levelOf(h) { return this.current[h] || 0; }
    signalOf(hormones) { return Math.max(0, ...hormones.map((h) => this.levelOf(h))); }

    renderEdges(sdt) {
      this.edges.forEach((e) => {
        let vis = 1;
        let lv;
        const extShown = !this.axis.nodes.external || !this.scene.nodeEls.external.g.classList.contains('hidden');

        if (e.kind === 'flow') {
          lv = this.levelOf(e.hormone);
          vis = e.ext ? Math.min(1, lv * 8) * (extShown ? 1 : 0) : 1;
          e.path.style.opacity = vis;
          e.arrow.style.opacity = vis * 0.9;
        } else if (e.kind === 'fb') {
          const s = this.signalOf(e.hormones);
          e.strength = s;
          lv = s;
          const blocked = this.fbBlocked.has(e.fbId);
          vis = e.ext ? Math.min(1, s * 8) * (extShown ? 1 : 0) : 1;
          const w = 1.5 + 4.5 * s;
          e.path.style.strokeWidth = w;
          e.path.style.opacity = vis * (blocked ? 0.38 : 0.2 + 0.8 * s);
          e.path.classList.toggle('blocked', blocked);
          if (e.end) { e.end.style.opacity = vis * (blocked ? 0.35 : 0.3 + 0.7 * s); }
          e.xmark.style.opacity = blocked ? vis : 0;
          e.blocked = blocked;
        } else { // ghost
          const on = this.fbBlocked.has(e.fbId);
          vis = on ? 1 : 0;
          lv = on ? this.signalOf(e.hormones) : 0;
          e.path.style.opacity = vis * 0.55;
          e.xmark.style.opacity = vis;
          e.blocked = true;
        }
        e.vis = vis;

        // יצירת חלקיקים
        if (sdt > 0 && vis > 0.15 && lv > 0.03) {
          const base = e.kind === 'flow' ? 3.2 : 2.0;
          const rate = base * Math.pow(lv, 1.35) * (e.kind === 'flow' ? 1 : 0.9);
          e.acc += rate * sdt;
          while (e.acc >= 1) {
            e.acc -= 1;
            if (this.particles.length < MAX_PARTICLES) this.spawn(e);
          }
        }
      });

      // תנועת חלקיקים
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        const e = p.edge;
        p.t += sdt / Math.max(MIN_TRAVEL, e.len / PARTICLE_SPEED);
        const stop = e.blocked ? 0.5 : 1;
        if (p.t >= stop) { p.use.remove(); this.particles.splice(i, 1); continue; }
        const pt = e.path.getPointAtLength(p.t * e.len);
        const edgeFade = Math.min(1, p.t * 10, (stop - p.t) * (e.blocked ? 14 : 10));
        p.use.setAttribute('transform', `translate(${pt.x.toFixed(1)},${pt.y.toFixed(1)}) scale(${p.scale})`);
        p.use.style.opacity = Math.max(0, edgeFade) * p.alpha;
      }
    }

    spawn(e) {
      const hm = e.hormoneDef;
      const use = el('use', { href: '#p-' + hm.shape, fill: hm.color, class: 'particle' }, this.scene.gParticles);
      if (hm.stroke) { use.setAttribute('stroke', hm.stroke); use.setAttribute('stroke-width', 1.5); }
      else if (hm.shape === 'antibody') { use.setAttribute('stroke', hm.color); }
      else { use.setAttribute('stroke', 'rgba(255,255,255,.55)'); use.setAttribute('stroke-width', 0.8); }
      const fb = e.kind !== 'flow';
      this.particles.push({ edge: e, t: 0, use, scale: fb ? 0.78 : 1, alpha: fb ? 0.8 : 1 });
    }

    renderChips() {
      const edges = this.edges;
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        if (!e.chip) continue;
        const v = this.levelOf(e.hormone);
        const st = E.levelState(v);
        const hidden = e.hormoneDef.external && v < 0.05;
        e.chip.g.classList.toggle('hidden', !!hidden);
        if (e.chip.state !== st) {
          e.chip.state = st;
          const lit = st === 'low' ? 1 : st === 'normal' ? 2 : 3;
          e.chip.bars.forEach((b, j) => {
            b.setAttribute('class', 'bar ' + (j < lit ? 'on lv-' + st : ''));
          });
          e.chip.g.setAttribute('data-level', st);
        }
      }
    }

    renderNodeGlow() {
      Object.keys(this.axis.nodes).forEach((id) => {
        const n = this.axis.nodes[id];
        const prod = Object.keys(this.axis.hormones).filter((h) => {
          const hm = this.axis.hormones[h];
          return hm.from === id && !hm.external;
        });
        const ne = this.scene.nodeEls[id];
        if (!ne) return;
        if (!prod.length) { ne.glow.style.opacity = 0; return; }
        const avg = prod.reduce((s, h) => s + this.levelOf(h), 0) / prod.length;
        ne.glow.style.opacity = (0.08 + avg * 0.42).toFixed(3);
      });
    }

    /** מדווח לממשק על שינוי של רמה בדידה (נמוך/תקין/גבוה). */
    emitLevels() {
      if (!this.opts.onLevels) return;
      const states = {};
      let changed = false;
      Object.keys(this.axis.hormones).forEach((h) => {
        const v = this.levelOf(h);
        const hm = this.axis.hormones[h];
        const s = hm.external && v < 0.05 ? 'none' : E.levelState(v);
        states[h] = s;
        if (this.lastStates[h] !== s) changed = true;
      });
      if (changed) { this.lastStates = states; this.opts.onLevels(states, this); }
    }
  }

  root.ENDO_Simulator = Simulator;
})(typeof window !== 'undefined' ? window : globalThis);
