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
      version: this.STORAGE_VERSION,
      user: {
        name: 'Estudiante CAD',
        email: 'estudiante@solidworks.edu',
        startDate: new Date().toISOString()
      },
      completedWeeks: [],
      quizResults: {},
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
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.min(100, Math.max(0, numericValue)) : 0;
  },

  migrateState(value) {
    const rawState = this.isPlainObject(value) ? value : {};
    const migrated = { ...rawState };

    // Keep legacy state compatible with schema v2.
    if (!Object.prototype.hasOwnProperty.call(migrated, 'version')) {
      migrated.version = 1;
    }

    if (Number(migrated.version) < this.STORAGE_VERSION) {
      migrated.version = this.STORAGE_VERSION;
    }

    return migrated;
  },

  normalizeState(value) {
    const defaults = this.getInitialState();
    const migrated = this.migrateState(value);
    const parsed = this.isPlainObject(migrated) ? migrated : {};
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
      if (typeof quizId === 'string' && quizId.trim() !== '' && Number.isFinite(Number(score))) {
        normalizedQuizResults[quizId] = this.clampScore(score);
      }
    }

    const normalizedQuizCompetencyGains = {};
    for (const [quizId, gains] of Object.entries(storedGains)) {
      if (!quizId || typeof quizId !== 'string' || !this.isPlainObject(gains)) continue;

      const normalizedGains = {};
      for (const competency of this.COMPETENCIES) {
        if (Object.prototype.hasOwnProperty.call(gains, competency)) {
          normalizedGains[competency] = this.clampScore(gains[competency]);
        }
      }

      if (Object.keys(normalizedGains).length > 0) {
        normalizedQuizCompetencyGains[quizId] = normalizedGains;
      }
    }

    const cswaScores = {};
    for (const competency of this.COMPETENCIES) {
      cswaScores[competency] = this.clampScore(scores[competency]);
    }

    return {
      ...defaults,
      ...parsed,
      version: this.STORAGE_VERSION,
      user: {
        ...defaults.user,
        ...user
      },
      completedWeeks: completedWeeks.sort((a, b) => a - b),
      quizResults: normalizedQuizResults,
      quizCompetencyGains: normalizedQuizCompetencyGains,
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

  setUserProfile(profile = {}) {
    const nextProfile = this.isPlainObject(profile) ? profile : {};
    const state = this.getUserProgress();
    state.user = {
      ...state.user,
      ...nextProfile
    };

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
    const previousGains = this.isPlainObject(state.quizCompetencyGains[quizId])
      ? state.quizCompetencyGains[quizId]
      : {};

    const nextGains = {};

    for (const competency of this.COMPETENCIES) {
      const previousGain = Number(previousGains[competency] || 0);
      state.cswaScores[competency] = this.clampScore(
        (Number(state.cswaScores[competency]) || 0) - previousGain
      );
    }

    for (const competency of this.COMPETENCIES) {
      if (!Object.prototype.hasOwnProperty.call(competencyGains, competency)) continue;

      const gainValue = Number(competencyGains[competency]);
      if (!Number.isFinite(gainValue) || gainValue < 0 || gainValue > 100) {
        console.warn(`Invalid gain for competency "${competency}"; expected a number from 0 to 100.`);
        continue;
      }

      const normalizedGain = this.clampScore(gainValue);
      nextGains[competency] = normalizedGain;
      state.cswaScores[competency] = this.clampScore(
        (Number(state.cswaScores[competency]) || 0) + normalizedGain
      );
    }

    state.quizResults[quizId] = this.clampScore(numericScore);
    state.quizCompetencyGains[quizId] = nextGains;

    const calculatedScore = this.calculateCSWAIndex();
    state.finalScore = this.clampScore(calculatedScore);

    this.saveProgress(state);
    return state;
  },

  calculateCSWAIndex() {
    const state = this.getUserProgress();
    const scores = this.COMPETENCIES.map(competency => this.clampScore(state.cswaScores[competency]));
    if (scores.length === 0) return 0;

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const completionBonus = (state.completedWeeks.length / this.TOTAL_WEEKS) * 20;
    return Math.min(100, Math.max(0, Math.round((averageScore * 0.8) + completionBonus)));
  },

  getCourseSummary() {
    const state = this.getUserProgress();
    const completionPercent = Math.round((state.completedWeeks.length / this.TOTAL_WEEKS) * 100);
    const averageCompetencyScore = this.COMPETENCIES.length > 0
      ? Math.round(
          this.COMPETENCIES.reduce((sum, competency) => sum + this.clampScore(state.cswaScores[competency]), 0)
          / this.COMPETENCIES.length
        )
      : 0;

    return {
      totalWeeks: this.TOTAL_WEEKS,
      completedWeeks: state.completedWeeks.length,
      completionPercent,
      averageCompetencyScore,
      cswaIndex: this.calculateCSWAIndex(),
      projectSubmitted: Boolean(state.projectSubmitted),
      finalScore: state.finalScore !== null ? this.clampScore(state.finalScore) : this.calculateCSWAIndex()
    };
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

window.AppState = AppState;
