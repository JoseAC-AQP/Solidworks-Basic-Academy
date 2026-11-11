/**
 * SOLIDWORKS ACADEMY - Global Engine & State Manager
 * Persists user progress, CSWA competency scores, and quiz results in LocalStorage.
 * Updated 2026.
 */

const AppState = {
  // Key name for local storage
  STORAGE_KEY: 'SW_ACADEMY_USER_STATE',

  // Default state layout
  getInitialState() {
    return {
      user: {
        name: 'Estudiante CAD',
        email: 'estudiante@solidworks.edu',
        startDate: new Date().toISOString()
      },
      completedWeeks: [], // Array of completed week numbers e.g. [1, 2, 3]
      quizResults: {},   // Quiz scores e.g. { semana1_quiz: 100, semana4_eval1: 95 }
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

  // Read state from LocalStorage
  getUserProgress() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return this.getInitialState();
      const parsed = JSON.parse(data);
      return { ...this.getInitialState(), ...parsed };
    } catch (e) {
      console.error('Error reading LocalStorage AppState', e);
      return this.getInitialState();
    }
  },

  // Save state to LocalStorage
  saveProgress(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving LocalStorage AppState', e);
    }
  },

  // Mark a week as completed
  markWeekCompleted(weekNumber) {
    const state = this.getUserProgress();
    const num = parseInt(weekNumber, 10);
    if (!state.completedWeeks.includes(num)) {
      state.completedWeeks.push(num);
    }
    this.saveProgress(state);
    return state;
  },

  // Record quiz or practical exam scores & update CSWA competencies
  recordQuizResult(quizId, score, competencyGains = {}) {
    const state = this.getUserProgress();
    state.quizResults[quizId] = score;

    // Increment corresponding CSWA competency scores (capped at 100)
    for (const [comp, gain] of Object.entries(competencyGains)) {
      if (Object.prototype.hasOwnProperty.call(state.cswaScores, comp)) {
        state.cswaScores[comp] = Math.min(100, (state.cswaScores[comp] || 0) + gain);
      }
    }

    this.saveProgress(state);
    return state;
  },

  // Calculate weighted overall CSWA Index (0 to 100%)
  calculateCSWAIndex() {
    const state = this.getUserProgress();
    const scores = Object.values(state.cswaScores);
    if (scores.length === 0) return 0;
    
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const weekProgressBonus = (state.completedWeeks.length / 16) * 20; // 20% weight from course completion
    
    const totalIndex = Math.min(100, Math.round((avgScore * 0.8) + weekProgressBonus));
    return totalIndex;
  },

  // Reset progress (for practice retries)
  resetProgress() {
    localStorage.removeItem(this.STORAGE_KEY);
    return this.getInitialState();
  }
};

// Global export
window.AppState = AppState;
