// SOLIDWORKS ACADEMY - Main Application Logic & LocalStorage State Manager

const AppState = {
  // Clave principal del LocalStorage
  STORAGE_KEY: 'sw_academy_progress',

  // Estado inicial por defecto del estudiante
  getDefaultState: function() {
    return {
      completedWeeks: [],
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
      overallIndex: 0,
      quizResults: {},
      lastActivity: new Date().toISOString()
    };
  },

  // Obtener progreso almacenado
  getUserProgress: function() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : this.getDefaultState();
    } catch (e) {
      console.error('Error al leer LocalStorage:', e);
      return this.getDefaultState();
    }
  },

  // Guardar progreso actualizado
  saveProgress: function(progress) {
    try {
      progress.lastActivity = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Error al guardar en LocalStorage:', e);
    }
  },

  // Calcular el Índice Global de Preparación CSWA (0-100%)
  calculateCSWAIndex: function() {
    const progress = this.getUserProgress();
    const scores = progress.cswaScores;
    const values = Object.values(scores);
    
    if (values.length === 0) return 0;

    const total = values.reduce((acc, curr) => acc + curr, 0);
    const avg = Math.round(total / values.length);

    progress.overallIndex = avg;
    this.saveProgress(progress);
    return avg;
  },

  // Marcar una semana académica como completada
  markWeekCompleted: function(weekNumber) {
    const progress = this.getUserProgress();
    if (!progress.completedWeeks.includes(weekNumber)) {
      progress.completedWeeks.push(weekNumber);
      this.saveProgress(progress);
    }
    return progress;
  },

  // Registrar resultado de evaluación y actualizar puntajes de competencias
  recordQuizResult: function(quizId, score, competencyUpdates = {}) {
    const progress = this.getUserProgress();
    
    // Guardar puntuación obtenida en la evaluación
    progress.quizResults[quizId] = {
      score: score,
      date: new Date().toISOString()
    };

    // Actualizar competencias CSWA con los nuevos puntajes evaluados
    for (const [competency, value] of Object.entries(competencyUpdates)) {
      if (progress.cswaScores.hasOwnProperty(competency)) {
        progress.cswaScores[competency] = Math.min(100, Math.max(0, value));
      }
    }

    this.saveProgress(progress);
    this.calculateCSWAIndex();
    return progress;
  },

  // Reiniciar avance completo
  resetProgress: function() {
    localStorage.removeItem(this.STORAGE_KEY);
    return this.getDefaultState();
  }
};

// Inicialización de la interfaz global al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('SOLIDWORKS ACADEMY - Core Engine (app.js) listo.');

  // Actualizar indicador general si el elemento existe en el DOM
  const overallIndexEl = document.getElementById('cswa-index-val');
  if (overallIndexEl) {
    const index = AppState.calculateCSWAIndex();
    overallIndexEl.textContent = index + '%';
  }

  // Actualizar contador de semanas completadas si existe el elemento
  const completedCountEl = document.getElementById('completed-weeks-count');
  if (completedCountEl) {
    const progress = AppState.getUserProgress();
    completedCountEl.textContent = `${progress.completedWeeks.length} / 16`;
  }
});
