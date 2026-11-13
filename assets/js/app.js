/**
 * SOLIDWORKS ACADEMY - Core App State & Analytics Engine
 * Persists user progress, CSWA competency scores, and quiz results in LocalStorage.
 */

const AppState = {
  STORAGE_KEY: 'SW_ACADEMY_USER_STATE',
  TOTAL_WEEKS: 16,
  COMPETENCIES: [
    'croquis',
    'piezas',
    'modificacion',
    'interpretacion',
    'operaciones',
    'propiedades_fisicas',
    'ensamblajes',
    'relaciones_posicion',
    'tiempo_limite'
  ],

  getInitialState() {
    return {
      user: {
        name: 'Estudiante CAD',
        email: 'estudiante@solidworks.edu',
        startDate: new Date().toISOString()
      },
      completedWeeks: [],
      quizResults: {},
      // Stores each quiz's latest competency contribution, so retries replace it.
      quizCompetencyGains: {},
      cswaScores: {
        croquis: 0,
        piezas: 0,
        modificacion: 0,
        interpretacion: 0,
        operaciones: 0,
        propiedades_fisicas: 0,
        ensamblajes: 0,
        relaciones_posicion: 0,
        tiempo_limite: 0
      },
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

  normalizeState(value) {
    const defaults = this.getInitialState();
    const parsed = this.isPlainObject(value) ? value : {};
    const user = this.isPlainObject(parsed.user) ? parsed.user : {};
    const scores = this.isPlainObject(parsed.cswaScores) ? parsed.cswaScores : {};
    const quizResults = this.isPlainObject(parsed.quizResults) ? parsed.quizResults : {};
    const storedGains = this.isPlainObject(parsed.quizCompetencyGains)
      ? parsed.quizCompetencyGains
      : {};

    const completedWeeks = Array.isArray(parsed.completedWeeks)
      ? [...new Set(parsed.completedWeeks
          .map(Number)
          .filter(week => Number.isInteger(week) && week >= 1 && week <= this.TOTAL_WEEKS))]
      : [];

    const normalizedQuizResults = {};
    for (const [quizId, score] of Object.entries(quizResults)) {
      if (quizId.trim() !== '' && Number.isFinite(Number(score))) {
        normalizedQuizResults[quizId] = this.clampScore(score);
      }
    }

    const quizCompetencyGains = {};
    for (const [quizId, gains] of Object.entries(storedGains)) {
      if (!quizId.trim() || !this.isPlainObject(gains)) continue;
      quizCompetencyGains[quizId] = {};
      for (const competency of this.COMPETENCIES) {
        if (Object.prototype.hasOwnProperty.call(gains, competency)) {
          quizCompetencyGains[quizId][competency] = this.clampScore(gains[competency]);
        }
      }
    }

    const cswaScores = {};
    for (const competency of this.COMPETENCIES) {
      cswaScores[competency] = this.clampScore(scores[competency]);
    }

    return {
      ...defaults,
      ...parsed,
      user: { ...defaults.user, ...user },
      completedWeeks,
      quizResults: normalizedQuizResults,
      quizCompetencyGains,
      cswaScores,
      projectSubmitted: Boolean(parsed.projectSubmitted),
      finalScore: parsed.finalScore == null ? null : this.clampScore(parsed.finalScore)
    };
  },

  getUserProgress() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return this.getInitialState();
      return this.normalizeState(JSON.parse(data));
    } catch (error) {
      console.error('Error reading LocalStorage AppState', error);
      return this.getInitialState();
    }
  },

  saveProgress(state) {
    try {
      const normalized = this.normalizeState(state);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(normalized));
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

  recordQuizResult(quizId, score, competencyGains = {}) {
    if (typeof quizId !== 'string' || quizId.trim() === '') {
      console.warn('Invalid quiz ID; expected a non-empty string.');
      return this.getUserProgress();
    }

    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
      console.warn('Invalid quiz score; expected a number from 0 to 100.');
      return this.getUserProgress();
    }
    if (!this.isPlainObject(competencyGains)) {
      console.warn('Invalid competency gains; expected an object.');
      return this.getUserProgress();
    }

    const state = this.getUserProgress();
    const previousGains = state.quizCompetencyGains[quizId] || {};
    const nextGains = {};

    for (const competency of this.COMPETENCIES) {
      const rawGain = competencyGains[competency];
      if (rawGain === undefined) continue;
      const gain = Number(rawGain);
      if (!Number.isFinite(gain) || gain < 0 || gain > 100) {
        console.warn(`Invalid gain for competency "${competency}"; expected a number from 0 to 100.`);
        continue;
      }
      nextGains[competency] = gain;
      // Replace this quiz's previous contribution rather than accumulating on retries.
      state.cswaScores[competency] = this.clampScore(
        state.cswaScores[competency] - (previousGains[competency] || 0) + gain
      );
    }

    state.quizResults[quizId] = this.clampScore(numericScore);
    state.quizCompetencyGains[quizId] = nextGains;
    this.saveProgress(state);
    return state;
  },

  // Competency scores contribute 80%; course completion contributes 20%.
  calculateCSWAIndex() {
    const state = this.getUserProgress();
    const scores = this.COMPETENCIES.map(competency => state.cswaScores[competency]);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const completionBonus = (state.completedWeeks.length / this.TOTAL_WEEKS) * 20;
    return Math.min(100, Math.max(0, Math.round((averageScore * 0.8) + completionBonus)));
  },

  resetProgress() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting LocalStorage AppState', error);
    }
    return this.getInitialState();
  }
};

// Global export
window.AppState = AppState;
