/* ==========================================================================
   core.js — רישום צירים ומחלות, וחישוב מצב לכל שלב באנימציה.
   הקובץ אינו תלוי ב-DOM, ולכן גם סקריפט הבדיקה (tests/validate.js) משתמש בו.
   ========================================================================== */
(function (root) {
  'use strict';

  /** רמות איכותיות. הערכים המספריים משמשים רק לתדירות חלקיקים ולאנימציה. */
  const LEVEL_VALUE = { none: 0, low: 0.18, normal: 0.5, high: 0.92 };
  const LEVEL_HE = { low: 'נמוך', normal: 'תקין', high: 'גבוה' };

  /** המרת ערך רציף (בזמן אנימציה) לאחת משלוש הרמות. */
  function levelState(v) {
    if (v <= 0.3) return 'low';
    if (v >= 0.7) return 'high';
    return 'normal';
  }

  /** שמות שלבים ניטרליים — משמשים במצב אבחון, כדי לא לחשוף מידע על המחלה. */
  const PHASE_NEUTRAL_HE = {
    normal: 'מצב תקין',
    disturbance: 'משהו משתנה במערכת',
    response: 'תגובת הציר',
    final: 'המצב החדש',
  };

  const axes = {};
  const order = [];

  function registerAxis(axis) {
    if (axes[axis.id]) throw new Error('axis already registered: ' + axis.id);
    axis.diseases = axis.diseases || [];
    axes[axis.id] = axis;
    order.push(axis.id);
    order.sort((a, b) => (axes[a].order || 99) - (axes[b].order || 99));
  }

  function registerDiseases(axisId, list) {
    const axis = axes[axisId];
    if (!axis) throw new Error('unknown axis: ' + axisId);
    list.forEach((d) => {
      d.axisId = axisId;
      axis.diseases.push(d);
    });
  }

  function getAxis(id) { return axes[id]; }
  function listAxes() { return order.map((id) => axes[id]); }
  function getDisease(axisId, diseaseId) {
    return axes[axisId].diseases.find((d) => d.id === diseaseId);
  }

  /** רצף השלבים המלא של מחלה: שלב פתיחה תקין של הציר + שלבי המחלה. */
  function stepsOf(axis, disease) {
    if (disease.noIntro || !axis.introStep) return disease.steps;
    return [axis.introStep].concat(disease.steps);
  }

  /** רמות ההתחלה: כל ההורמונים של הציר במצב תקין, ההורמונים החיצוניים כבויים. */
  function baseLevels(axis) {
    const out = {};
    Object.keys(axis.hormones).forEach((h) => {
      out[h] = axis.hormones[h].external ? 'none' : 'normal';
    });
    return out;
  }

  /**
   * המצב המצטבר אחרי שלב i (כולל). i = -1 → המצב ההתחלתי.
   * מחזיר: levels (שמות רמות), status (מצב איברים), shown (צמתים חיצוניים שמוצגים),
   * blocked (קשתות משוב שאינן פועלות).
   */
  function stateAt(axis, disease, i) {
    const steps = stepsOf(axis, disease);
    const state = {
      levels: baseLevels(axis),
      status: {},
      shown: new Set(),
      blocked: new Set(),
    };
    for (let k = 0; k <= i && k < steps.length; k++) {
      const s = steps[k];
      Object.assign(state.levels, s.levels || {});
      Object.assign(state.status, s.status || {});
      (s.show || []).forEach((n) => state.shown.add(n));
      (s.blocked || []).forEach((b) => state.blocked.add(b));
    }
    return state;
  }

  root.ENDO = {
    LEVEL_VALUE,
    LEVEL_HE,
    PHASE_NEUTRAL_HE,
    levelState,
    registerAxis,
    registerDiseases,
    getAxis,
    listAxes,
    getDisease,
    stepsOf,
    baseLevels,
    stateAt,
  };
})(typeof window !== 'undefined' ? window : globalThis);
