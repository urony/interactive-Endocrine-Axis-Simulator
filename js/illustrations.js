/* ==========================================================================
   illustrations.js — איורי האיברים (SVG) ופורטים לחיבור זרימות.
   כל איור מצויר סביב (0,0). אלמנטים עם class="organ-body" נצבעים לפי מצב האיבר.
   ports: נקודות היציאה/כניסה של זרימות (t=למעלה, b=למטה, l=שמאל, r=ימין).
   adenoma: מיקום הגוש כשיש אדנומה. halo: רדיוסי טבעת ההדגשה.
   ========================================================================== */
(function (root) {
  'use strict';

  const I = {};

  I.hypothalamus = {
    ports: { t: [0, -76], b: [0, 62], l: [-110, -8], r: [110, -8] },
    adenoma: [34, 20],
    halo: [118, 78],
    svg: `
      <path class="ctx" d="M-100,8 C-112,-32 -78,-62 -42,-58 C-26,-74 24,-74 40,-58 C78,-62 112,-30 100,6 C96,28 70,38 48,34 L-48,34 C-76,38 -96,28 -100,8Z"/>
      <path class="ctx-line" d="M-62,-30 C-44,-46 -22,-30 -6,-44 M12,-42 C30,-54 52,-40 64,-26 M-72,-4 C-52,-18 -36,-6 -22,-16 M20,-14 C40,-24 60,-12 80,-18 M-40,14 C-26,6 -14,16 0,8"/>
      <path class="organ-body" d="M-7,40 L7,40 L4,62 L-4,62Z"/>
      <ellipse class="organ-body" cx="0" cy="26" rx="36" ry="21"/>
      <ellipse class="shine" cx="-10" cy="19" rx="17" ry="6"/>`,
  };

  I.pituitary = {
    ports: { t: [0, -52], b: [0, 42], l: [-64, 6], r: [64, 6] },
    adenoma: [-30, -4],
    halo: [76, 58],
    svg: `
      <path class="ctx-line thick" d="M-66,16 Q0,76 66,16"/>
      <path class="organ-body stalk" d="M-5,-50 L5,-50 L4,-14 L-4,-14Z"/>
      <ellipse class="organ-body" cx="-12" cy="8" rx="34" ry="27"/>
      <ellipse class="organ-body post" cx="27" cy="5" rx="17" ry="19"/>
      <ellipse class="shine" cx="-20" cy="-2" rx="16" ry="6"/>`,
  };

  I.thyroid = {
    ports: { t: [0, -66], b: [0, 66], l: [-72, 0], r: [72, 0] },
    adenoma: [-40, 8],
    halo: [88, 78],
    svg: `
      <rect class="ctx" x="-12" y="-64" width="24" height="128" rx="11"/>
      <path class="ctx-line" d="M-12,-48 H12 M-12,-34 H12 M-12,-20 H12 M-12,24 H12 M-12,38 H12 M-12,52 H12"/>
      <path class="organ-body" d="M-9,-20 C-30,-54 -68,-46 -66,-8 C-64,28 -42,50 -23,48 C-11,46 -9,22 -9,-20Z"/>
      <path class="organ-body" d="M9,-20 C30,-54 68,-46 66,-8 C64,28 42,50 23,48 C11,46 9,22 9,-20Z"/>
      <rect class="organ-body" x="-16" y="-8" width="32" height="18" rx="7"/>
      <ellipse class="shine" cx="-42" cy="-20" rx="9" ry="16" transform="rotate(14 -42 -20)"/>`,
  };

  I.adrenal = {
    ports: { t: [0, -84], b: [0, 74], l: [-60, -50], r: [60, -50] },
    adenoma: [30, -54],
    halo: [86, 96],
    svg: `
      <path class="ctx" d="M0,-36 C48,-42 66,0 52,38 C42,66 8,78 -20,68 C-36,62 -32,46 -23,38 C-14,30 -14,14 -24,6 C-36,-8 -34,-30 0,-36Z"/>
      <path class="ctx-line" d="M18,-20 C34,-8 36,16 28,38 M6,-8 C16,4 16,20 10,34"/>
      <path class="organ-body" d="M-44,-34 C-36,-78 38,-86 50,-40 C24,-56 -18,-52 -44,-34Z"/>
      <path class="med" d="M-18,-52 C-8,-64 16,-64 26,-52 C10,-58 -6,-58 -18,-52Z"/>
      <ellipse class="shine" cx="-8" cy="-62" rx="18" ry="4"/>`,
  };

  I.liver = {
    ports: { t: [0, -52], b: [0, 52], l: [-100, 0], r: [100, 0] },
    adenoma: [30, -10],
    halo: [112, 70],
    svg: `
      <path class="organ-body" d="M-96,-8 C-92,-46 -22,-56 40,-46 C82,-40 102,-20 100,2 C72,38 22,52 -30,44 C-72,40 -100,22 -96,-8Z"/>
      <path class="ctx-line light" d="M-8,-48 C-14,-20 -10,10 6,44"/>
      <path class="gb" d="M18,34 C14,46 30,54 38,46 C44,38 32,28 18,34Z"/>
      <ellipse class="shine" cx="-44" cy="-22" rx="30" ry="8"/>`,
  };

  I.body = {
    ports: { t: [0, -74], b: [0, 70], l: [-50, 0], r: [50, 0] },
    adenoma: [0, 0],
    halo: [64, 86],
    svg: `
      <circle class="organ-body" cx="0" cy="-54" r="16"/>
      <path class="organ-body" d="M-24,-34 H24 C34,-34 40,-26 40,-14 V22 H27 V72 H5 V26 H-5 V72 H-27 V22 H-40 V-14 C-40,-26 -34,-34 -24,-34Z"/>
      <ellipse class="shine" cx="-14" cy="-20" rx="6" ry="16"/>`,
  };

  I.bone = {
    ports: { t: [0, -40], b: [0, 44], l: [-96, 0], r: [96, 0] },
    adenoma: [0, 0],
    halo: [112, 62],
    svg: `
      <path class="ctx" d="M-72,26 C-30,6 30,6 72,26 C84,40 52,46 0,36 C-52,46 -84,40 -72,26Z"/>
      <rect class="organ-body" x="-56" y="-9" width="112" height="18" rx="4"/>
      <circle class="organ-body" cx="-64" cy="-11" r="14"/><circle class="organ-body" cx="-64" cy="11" r="14"/>
      <circle class="organ-body" cx="64" cy="-11" r="14"/><circle class="organ-body" cx="64" cy="11" r="14"/>
      <rect class="shine" x="-52" y="-6" width="104" height="4" rx="2"/>`,
  };

  /* ---------- מקורות חיצוניים לציר ---------- */

  I.lymphocyte = {
    ports: { t: [0, -46], b: [0, 46], l: [-46, 0], r: [46, 0] },
    halo: [58, 58],
    svg: `
      <circle class="organ-body" cx="0" cy="0" r="34"/>
      <circle class="nuc" cx="-4" cy="3" r="17"/>
      <g class="ctx-line thick"><path d="M0,-34 V-44 M0,-44 l-5,-6 M0,-44 l5,-6"/>
      <path d="M30,-17 l8,-5 M38,-22 l-1,-8 M38,-22 l7,-3"/>
      <path d="M-30,-17 l-8,-5 M-38,-22 l1,-8 M-38,-22 l-7,-3"/></g>
      <ellipse class="shine" cx="-14" cy="-16" rx="12" ry="5"/>`,
  };

  I.lungTumor = {
    ports: { t: [0, -48], b: [0, 52], l: [-66, 0], r: [66, 0] },
    halo: [76, 66],
    svg: `
      <path class="ctx" d="M-8,-36 C-44,-44 -64,6 -54,44 C-46,58 -16,52 -8,38Z"/>
      <path class="ctx" d="M8,-36 C44,-44 64,6 54,44 C46,58 16,52 8,38Z"/>
      <path class="ctx-line thick" d="M0,-46 V-10 M0,-10 L-12,6 M0,-10 L12,6"/>
      <circle class="organ-body" cx="-34" cy="4" r="13"/>
      <circle class="nuc" cx="-38" cy="1" r="4"/>
      <ellipse class="shine" cx="-38" cy="-2" rx="6" ry="3"/>`,
  };

  I.pill = {
    ports: { t: [0, -42], b: [0, 42], l: [-52, 0], r: [52, 0] },
    halo: [62, 52],
    svg: `
      <g transform="rotate(-32)">
        <rect class="pill-half" x="-44" y="-15" width="46" height="30" rx="15"/>
        <rect class="organ-body" x="-2" y="-15" width="46" height="30" rx="15"/>
        <rect class="pill-half" x="-10" y="-15" width="14" height="30"/>
        <rect class="organ-body" x="-2" y="-15" width="10" height="30"/>
        <rect class="shine" x="-34" y="-10" width="64" height="5" rx="2.5"/>
      </g>
      <circle class="pill-half" cx="30" cy="30" r="9"/>`,
  };

  /** צורה ניטרלית של "מקור חיצוני" — משמשת במצב אבחון לפני חשיפת התשובה. */
  I.unknown = {
    ports: { t: [0, -44], b: [0, 44], l: [-44, 0], r: [44, 0] },
    halo: [56, 56],
    svg: `
      <circle class="unknown-ring" cx="0" cy="0" r="34"/>
      <text class="unknown-q" x="0" y="13" text-anchor="middle">?</text>`,
  };

  root.ENDO_ILLUSTRATIONS = I;
})(typeof window !== 'undefined' ? window : globalThis);
