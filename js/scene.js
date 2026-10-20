/* ==========================================================================
   scene.js — בניית התרשים (SVG) של ציר: איברים, צינורות זרימה, קשתות משוב,
   תוויות ושבבי רמה. הקובץ אינו מכיר מחלות; הוא רק מציג את מה שהמנוע מורה לו.
   ========================================================================== */
(function (root) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const ILL = root.ENDO_ILLUSTRATIONS;
  const DIR = { t: [0, -1], b: [0, 1], l: [-1, 0], r: [1, 0] };

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach((k) => n.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(n);
    return n;
  }

  /** רוחב משוער של טקסט עברי/לטיני בגודל 18px. */
  function textWidth(s, size) {
    return s.length * (size || 18) * 0.56;
  }

  /** שבירת שורות לפי מספר תווים מקסימלי. */
  function wrap(str, max) {
    const lines = [];
    let cur = '';
    str.split(' ').forEach((w) => {
      if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; }
      else cur = cur ? cur + ' ' + w : w;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  class Scene {
    constructor(svg, axis) {
      this.svg = svg;
      this.axis = axis;
      this.extShape = 'unknown';
      this.nodeEls = {};
      this.edges = [];
      this.chips = {};
      this.build();
    }

    /* ---------- גאומטריה ---------- */

    shapeOf(nodeId) {
      const n = this.axis.nodes[nodeId];
      return n.external ? this.extShape : n.shape;
    }

    port(nodeId, side, offset) {
      const n = this.axis.nodes[nodeId];
      const p = ILL[this.shapeOf(nodeId)].ports[side];
      return {
        x: n.x + p[0] + (offset ? offset[0] : 0),
        y: n.y + p[1] + (offset ? offset[1] : 0),
        d: DIR[side],
      };
    }

    pathD(a, b, k) {
      const kk = k != null ? k : Math.hypot(b.x - a.x, b.y - a.y) * 0.4;
      return `M${a.x},${a.y} C${a.x + a.d[0] * kk},${a.y + a.d[1] * kk} ${b.x + b.d[0] * kk},${b.y + b.d[1] * kk} ${b.x},${b.y}`;
    }

    /* ---------- בנייה ---------- */

    build() {
      const { svg, axis } = this;
      svg.innerHTML = '';
      svg.setAttribute('viewBox', `0 0 ${axis.viewBox[0]} ${axis.viewBox[1]}`);
      this.gTubes = el('g', { class: 'layer-tubes' }, svg);
      this.gNodes = el('g', { class: 'layer-nodes' }, svg);
      this.gParticles = el('g', { class: 'layer-particles' }, svg);
      this.gChips = el('g', { class: 'layer-chips' }, svg);
      this.buildNodes();
      this.buildEdges();
      this.buildChips();
      this.refreshPaths();
    }

    buildNodes() {
      const { axis } = this;
      Object.keys(axis.nodes).forEach((id) => {
        const n = axis.nodes[id];
        const g = el('g', {
          class: 'node' + (n.external ? ' external hidden' : ''),
          'data-node': id,
          'data-shape': n.external ? 'unknown' : n.shape,
          transform: `translate(${n.x},${n.y})`,
        }, this.gNodes);
        const shape = this.shapeOf(id);
        const ill = ILL[shape];
        const glowColor = n.produces && n.produces[0] ? axis.hormones[n.produces[0]].color : '#ffffff';
        el('ellipse', { class: 'glow', rx: ill.halo[0], ry: ill.halo[1], fill: glowColor }, g);
        el('ellipse', { class: 'halo', rx: ill.halo[0] + 6, ry: ill.halo[1] + 6 }, g);
        const illus = el('g', { class: 'illus' }, g);
        illus.innerHTML = ill.svg;
        const ov = el('g', { class: 'overlay' }, g);
        const adenoma = ill.adenoma || [0, 0];
        const ad = el('g', { class: 'ov-adenoma', transform: `translate(${adenoma[0]},${adenoma[1]})` }, ov);
        el('circle', { r: 15 }, ad);
        el('circle', { r: 5.5, class: 'core' }, ad);
        el('path', { class: 'ov-crack', d: 'M-16,-34 l9,15 l-11,11 l13,16 l-7,15' }, ov);
        const label = el('g', { class: 'label' }, g);
        this.nodeEls[id] = { g, illus, label, ov, glow: g.querySelector('.glow'), halo: g.querySelector('.halo') };
        if (n.external) {
          this.setLabelLines(id, ['מקור חיצוני לציר']);
        } else {
          this.setLabelLines(id, [n.labelHe]);
        }
      });
    }

    /** כתיבת תווית (כמה שורות) בתוך "גלולה" כהה. */
    setLabelLines(id, lines) {
      const n = this.axis.nodes[id];
      const { label } = this.nodeEls[id];
      label.innerHTML = '';
      const cfg = n.label || {
        dx: 0,
        dy: ILL[this.shapeOf(id)].halo[1] + 14 + (lines.length * 22) / 2,
        anchor: 'middle',
      };
      const lh = 22;
      const w = Math.max(...lines.map((l) => textWidth(l))) + 22;
      const h = lines.length * lh + 8;
      const x0 = cfg.anchor === 'end' ? -w : cfg.anchor === 'middle' ? -w / 2 : 0;
      label.setAttribute('transform', `translate(${cfg.dx},${cfg.dy})`);
      el('rect', { x: x0, y: -h / 2, width: w, height: h, rx: 11 }, label);
      lines.forEach((ln, i) => {
        const t = el('text', {
          x: x0 + w / 2, y: -h / 2 + 4 + lh * (i + 0.78),
          'text-anchor': 'middle', direction: 'rtl',
        }, label);
        t.textContent = ln;
      });
    }

    /** מחליף את האיור של המקור החיצוני (וגם את חיבורי הזרימות אליו). */
    setExternal(shape, labelText) {
      if (!this.axis.nodes.external) return;
      this.extShape = shape;
      const { g, illus, glow, halo } = this.nodeEls.external;
      const ill = ILL[shape];
      illus.innerHTML = ill.svg;
      g.setAttribute('data-shape', shape);
      glow.setAttribute('rx', ill.halo[0]); glow.setAttribute('ry', ill.halo[1]);
      halo.setAttribute('rx', ill.halo[0] + 6); halo.setAttribute('ry', ill.halo[1] + 6);
      this.setLabelLines('external', wrap(labelText, 15));
      const ov = this.nodeEls.external.ov.querySelector('.ov-adenoma');
      ov.setAttribute('transform', 'translate(0,0)');
      this.refreshPaths();
    }

    buildEdges() {
      const { axis } = this;

      axis.flows.forEach((f) => {
        const hm = axis.hormones[f.hormone];
        const path = el('path', { class: 'tube', 'data-edge': f.id }, this.gTubes);
        const arrow = el('path', { class: 'arrowhead', d: 'M-8,-9 L0,0 L8,-9' }, this.gTubes);
        this.edges.push({
          kind: 'flow', id: f.id, def: f, hormone: f.hormone, hormoneDef: hm,
          path, arrow, ext: !!hm.external || f.from === 'external' || f.to === 'external',
          rate: 1, from: () => this.port(f.from, f.fromPort, f.fromOffset), to: () => this.port(f.to, f.toPort, f.toOffset), k: f.k,
        });
      });

      axis.feedback.forEach((fb) => {
        if (fb.ghost) {
          const path = el('path', { class: 'fb-line ghost', 'data-edge': fb.id }, this.gTubes);
          const x = this.makeX();
          this.edges.push({
            kind: 'ghost', id: fb.id, fbId: fb.id, def: fb, hormone: fb.hormones[0], hormones: fb.hormones,
            hormoneDef: axis.hormones[fb.hormones[0]], path, xmark: x, sign: '-', rate: 0.6,
            from: () => this.port(fb.fromNode, fb.fromPort, fb.fromOffset),
            to: () => this.port(fb.toNode, fb.toPort, fb.toOffset), k: fb.k,
          });
          return;
        }
        const signs = fb.effects.map((e) => e.sign);
        const sign = signs.every((s) => s === '-') ? '-' : signs.every((s) => s === '+') ? '+' : 'm';
        fb.sources.forEach((src, i) => {
          const path = el('path', { class: 'fb-line sign-' + (sign === '+' ? 'plus' : 'minus'), 'data-edge': fb.id }, this.gTubes);
          const end = this.makeEnd(sign);
          const x = this.makeX();
          const hormone = src.hormones[0];
          this.edges.push({
            kind: 'fb', id: fb.id + '#' + i, fbId: fb.id, def: fb, src, hormone, hormones: src.hormones,
            hormoneDef: axis.hormones[hormone], path, end, xmark: x, sign, rate: 0.6,
            ext: src.node === 'external',
            from: () => this.port(src.node, src.port, src.fromOffset),
            to: () => this.port(fb.toNode, src.toPort || fb.toPort, fb.toOffset), k: src.k,
          });
        });
      });
    }

    makeEnd(sign) {
      const g = el('g', { class: 'fb-end sign-' + (sign === '+' ? 'plus' : 'minus') }, this.gTubes);
      if (sign === '-' || sign === 'm') el('line', { x1: -11, y1: 0, x2: 11, y2: 0, class: 'tbar' }, g);
      if (sign === '+') el('path', { d: 'M-9,-4 L0,9 L9,-4Z', class: 'arrow-plus' }, g);
      if (sign === 'm') {
        const p = el('g', { transform: 'translate(0,-16)', class: 'plus-badge' }, g);
        el('circle', { r: 8 }, p);
        el('path', { d: 'M-4,0 H4 M0,-4 V4' }, p);
      }
      return g;
    }

    makeX() {
      const g = el('g', { class: 'xmark' }, this.gTubes);
      el('circle', { r: 13 }, g);
      el('path', { d: 'M-6,-6 L6,6 M6,-6 L-6,6' }, g);
      return g;
    }

    buildChips() {
      const { axis } = this;
      this.edges.forEach((e) => {
        if (e.kind !== 'flow' || !e.def.chip) return;
        const hm = e.hormoneDef;
        const w = 30 + textWidth(hm.abbr, 17) + 40;
        const h = 32;
        const g = el('g', { class: 'chip' + (hm.external ? ' ext hidden' : ''), 'data-hormone': e.hormone }, this.gChips);
        el('rect', { x: 0, y: 0, width: w, height: h, rx: 10, style: `stroke:${hm.color}` }, g);
        const use = el('use', { href: '#p-' + hm.shape, x: 17, y: 16, fill: hm.color }, g);
        if (hm.stroke) { use.setAttribute('stroke', hm.stroke); use.setAttribute('stroke-width', 1.5); }
        const t = el('text', { x: 32, y: 21.5, class: 'chip-text' }, g);
        t.textContent = hm.abbr;
        const bars = [];
        const bx = 32 + textWidth(hm.abbr, 17) + 8;
        for (let i = 0; i < 3; i++) {
          bars.push(el('rect', { class: 'bar', x: bx + i * 8, y: 8 + (2 - i) * 3, width: 5.5, height: 16 - (2 - i) * 3, rx: 1.5 }, g));
        }
        e.chip = { g, w, h, bars };
        this.chips[e.hormone] = this.chips[e.hormone] || e.chip;
      });
    }

    /** מחשב מחדש את כל המסלולים (למשל אחרי החלפת האיור של המקור החיצוני). */
    refreshPaths() {
      this.edges.forEach((e) => {
        const a = e.from();
        const b = e.to();
        const d = this.pathD(a, b, e.k);
        e.path.setAttribute('d', d);
        e.len = e.path.getTotalLength();
        const tip = e.path.getPointAtLength(e.len);
        const prev = e.path.getPointAtLength(Math.max(0, e.len - 6));
        const ang = (Math.atan2(tip.y - prev.y, tip.x - prev.x) * 180) / Math.PI + 90;
        if (e.arrow) {
          e.arrow.setAttribute('transform', `translate(${tip.x},${tip.y}) rotate(${ang})`);
        }
        if (e.end) {
          e.end.setAttribute('transform', `translate(${tip.x},${tip.y}) rotate(${ang})`);
        }
        const mid = e.path.getPointAtLength(e.len * 0.5);
        if (e.xmark) e.xmark.setAttribute('transform', `translate(${mid.x},${mid.y})`);
        if (e.chip) {
          const dx = e.def.chip.dx || 0;
          const dy = e.def.chip.dy || 0;
          const gap = Math.abs(dx);
          const x = dx > 0 ? mid.x + gap : dx < 0 ? mid.x - gap - e.chip.w : mid.x - e.chip.w / 2;
          e.chip.g.setAttribute('transform', `translate(${x},${mid.y + dy - e.chip.h / 2})`);
        }
      });
    }
  }

  root.ENDO_Scene = Scene;
  root.ENDO_el = el;
})(typeof window !== 'undefined' ? window : globalThis);
