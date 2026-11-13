/**
 * SOLIDWORKS ACADEMY - Core App State & Analytics Engine
 * Persists user progress, CSWA competency scores, quiz results, and course status in LocalStorage.
 * Supports state migration for future schema changes.
 */

const AppState = {
  STORAGE_KEY: 'SW_ACADEMY_USER_STATE',
  STORAGE_VERSION: 2,
  TOTAL_WEEKS: 16,
  COMPETENCIES: [
    'croquis', 'piezas', 'modificacion', 'interpretacion', 'operaciones',
    'propiedades_fisicas', 'ensamblajes', 'relaciones_posicion', 'tiempo_limite'
  ],

  getInitialState() {
    return {
      version: this.STORAGE_VERSION,
      user: { name: 'Estudiante CAD', email: 'estudiante@solidworks.edu', startDate: new Date().toISOString() },
      completedWeeks: [],
      quizResults: {},
      quizCompetencyGains: {},
      cswaScores: Object.fromEntries(this.COMPETENCIES.map(key => [key, 0])),
      projectSubmitted: false,
      finalScore: null
    };
  },

  isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  },

  clampScore(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 0;
  },

  migrateState(value) {
    const migrated = this.isPlainObject(value) ? { ...value } : {};
    if (!Object.prototype.hasOwnProperty.call(migrated, 'version')) migrated.version = 1;
    migrated.version = this.STORAGE_VERSION;
    return migrated;
  },

  normalizeState(value) {
    const defaults = this.getInitialState();
    const parsed = this.migrateState(value);
    const user = this.isPlainObject(parsed.user) ? parsed.user : {};
    const scores = this.isPlainObject(parsed.cswaScores) ? parsed.cswaScores : {};
    const results = this.isPlainObject(parsed.quizResults) ? parsed.quizResults : {};
    const gains = this.isPlainObject(parsed.quizCompetencyGains) ? parsed.quizCompetencyGains : {};
    const completedWeeks = Array.isArray(parsed.completedWeeks)
      ? [...new Set(parsed.completedWeeks.map(Number).filter(week => Number.isInteger(week) && week >= 1 && week <= this.TOTAL_WEEKS))].sort((a, b) => a - b)
      : [];

    const quizResults = {};
    for (const [quizId, score] of Object.entries(results)) {
      if (quizId.trim() && Number.isFinite(Number(score))) quizResults[quizId] = this.clampScore(score);
    }

    const quizCompetencyGains = {};
    for (const [quizId, quizGains] of Object.entries(gains)) {
      if (!quizId.trim() || !this.isPlainObject(quizGains)) continue;
      quizCompetencyGains[quizId] = {};
      for (const competency of this.COMPETENCIES) {
        if (Object.prototype.hasOwnProperty.call(quizGains, competency)) {
          quizCompetencyGains[quizId][competency] = this.clampScore(quizGains[competency]);
        }
      }
    }

    const cswaScores = {};
    for (const competency of this.COMPETENCIES) cswaScores[competency] = this.clampScore(scores[competency]);

    return {
      ...defaults,
      ...parsed,
      version: this.STORAGE_VERSION,
      user: { ...defaults.user, ...user },
      completedWeeks,
      quizResults,
      quizCompetencyGains,
      cswaScores,
      projectSubmitted: Boolean(parsed.projectSubmitted),
      finalScore: parsed.finalScore == null ? null : this.clampScore(parsed.finalScore)
    };
  },

  getUserProgress() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? this.normalizeState(JSON.parse(raw)) : this.getInitialState();
    } catch (error) {
      console.error('Error reading LocalStorage AppState', error);
      return this.getInitialState();
    }
  },

  notifyProgressChanged() {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('appstate:progresschange'));
    }
  },

  saveProgress(state) {
    try {
      const normalized = this.normalizeState(state);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(normalized));
      this.notifyProgressChanged();
      return true;
    } catch (error) {
      console.error('Error saving LocalStorage AppState', error);
      return false;
    }
  },

  markWeekCompleted(weekNumber) {
    const number = Number(weekNumber);
    if (!Number.isInteger(number) || number < 1 || number > this.TOTAL_WEEKS) {
      console.warn('Invalid week number; expected an integer from 1 to 16.');
      return this.getUserProgress();
    }
    const state = this.getUserProgress();
    if (!state.completedWeeks.includes(number)) {
      state.completedWeeks.push(number);
      state.completedWeeks.sort((a, b) => a - b);
    }
    this.saveProgress(state);
    return state;
  },

  setUserProfile(profile = {}) {
    const state = this.getUserProgress();
    state.user = { ...state.user, ...(this.isPlainObject(profile) ? profile : {}) };
    this.saveProgress(state);
    return state;
  },

  markProjectSubmitted(status = true) {
    const state = this.getUserProgress();
    state.projectSubmitted = Boolean(status);
    this.saveProgress(state);
    return state;
  },

  setFinalScore(score) {
    const state = this.getUserProgress();
    state.finalScore = this.clampScore(score);
    this.saveProgress(state);
    return state;
  },

  recordQuizResult(quizId, score, competencyGains = {}) {
    if (typeof quizId !== 'string' || !quizId.trim()) {
      console.warn('Invalid quiz ID; expected a non-empty string.');
      return this.getUserProgress();
    }
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100 || !this.isPlainObject(competencyGains)) {
      console.warn('Invalid quiz score or competency gains.');
      return this.getUserProgress();
    }

    const state = this.getUserProgress();
    const oldGains = this.isPlainObject(state.quizCompetencyGains[quizId]) ? state.quizCompetencyGains[quizId] : {};
    const nextGains = {};
    for (const competency of this.COMPETENCIES) {
      // Remove this quiz's prior contribution, including competencies omitted by a retry.
      const previous = Number(oldGains[competency]) || 0;
      state.cswaScores[competency] = this.clampScore((Number(state.cswaScores[competency]) || 0) - previous);
    }
    for (const competency of this.COMPETENCIES) {
      if (!Object.prototype.hasOwnProperty.call(competencyGains, competency)) continue;
      const gain = Number(competencyGains[competency]);
      if (!Number.isFinite(gain) || gain < 0 || gain > 100) {
        console.warn(`Invalid gain for competency "${competency}"; expected a number from 0 to 100.`);
        continue;
      }
      nextGains[competency] = gain;
      state.cswaScores[competency] = this.clampScore((Number(state.cswaScores[competency]) || 0) + gain);
    }

    state.quizResults[quizId] = this.clampScore(numericScore);
    state.quizCompetencyGains[quizId] = nextGains;
    state.finalScore = this.calculateCSWAIndex(state);
    this.saveProgress(state);
    return state;
  },

  calculateCSWAIndex(stateOverride = null) {
    const state = stateOverride ? this.normalizeState(stateOverride) : this.getUserProgress();
    const scores = this.COMPETENCIES.map(key => this.clampScore(state.cswaScores[key]));
    if (!scores.length) return 0;
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const completionBonus = (state.completedWeeks.length / this.TOTAL_WEEKS) * 20;
    return Math.min(100, Math.max(0, Math.round(averageScore * .8 + completionBonus)));
  },

  getCourseSummary() {
    const state = this.getUserProgress();
    const completedWeeks = state.completedWeeks.length;
    const averageCompetencyScore = this.COMPETENCIES.length
      ? Math.round(this.COMPETENCIES.reduce((sum, key) => sum + this.clampScore(state.cswaScores[key]), 0) / this.COMPETENCIES.length)
      : 0;
    return {
      totalWeeks: this.TOTAL_WEEKS,
      completedWeeks,
      completionPercent: Math.round(completedWeeks / this.TOTAL_WEEKS * 100),
      averageCompetencyScore,
      cswaIndex: this.calculateCSWAIndex(state),
      projectSubmitted: Boolean(state.projectSubmitted),
      finalScore: state.finalScore == null ? this.calculateCSWAIndex(state) : this.clampScore(state.finalScore)
    };
  },

  resetProgress() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.notifyProgressChanged();
    } catch (error) {
      console.error('Error resetting LocalStorage AppState', error);
    }
    return this.getInitialState();
  }
};

window.AppState = AppState;
