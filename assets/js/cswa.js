/**
 * SOLIDWORKS ACADEMY - CSWA Diagnostic & Evaluation Engine
 * Handles CSWA index calculations, 9-competency score breakdowns,
 * diagnostic renders, and personalized study plan generation.
 */

const CSWAEngine = {
  competencies: {
    croquis: {
      name: 'Croquizado 2D y Restricciones',
      description: 'Dominio de entidades 2D, cotas inteligentes y relaciones geométricas explícitas.',
      recommendedWeek: 3
    },
    piezas: {
      name: 'Modelado de Piezas 3D',
      description: 'Construcción de volúmenes mediante extrusión y revolución saliente/corte.',
      recommendedWeek: 5
    },
    modificacion: {
      name: 'Modificación Dimensional Paramétrica',
      description: 'Gestión de variables globales (=A, =B, =C) y tablas de ecuaciones sin perder la intención del diseño.',
      recommendedWeek: 8
    },
    interpretacion: {
      name: 'Interpretación de Planos 2D',
      description: 'Lectura de vistas ortogonales, cortes y detalles para reconstrucción 3D.',
      recommendedWeek: 8
    },
    operaciones: {
      name: 'Operaciones Avanzadas y Matrices',
      description: 'Uso eficiente de redondeos, chaflanes, vaciados y matrices lineales/circulares.',
      recommendedWeek: 6
    },
    propiedades_fisicas: {
      name: 'Propiedades Físicas y Masa',
      description: 'Asignación de materiales normados, medición de densidad, masa (g) y Centro de Gravedad.',
      recommendedWeek: 11
    },
    ensamblajes: {
      name: 'Ensamblajes y Componente Fijo',
      description: 'Montaje de componentes (.SLDASM), control del origen (f) y grados de libertad.',
      recommendedWeek: 9
    },
    relaciones_posicion: {
      name: 'Relaciones de Posición y Coordenadas',
      description: 'Aplicación de mates estándar/avanzados y creación de Sistemas de Coordenadas personalizados.',
      recommendedWeek: 10
    },
    tiempo_limite: {
      name: 'Rendimiento y Tiempo Límite',
      description: 'Velocidad de ejecución y resolución de problemas bajo la restricción de 180 minutos.',
      recommendedWeek: 15
    }
  },

  getCompetencyStatus(score) {
    if (score >= 85) return { label: 'Dominio Demostrado', class: 'badge-success' };
    if (score >= 70) return { label: 'Competente (CSWA Ready)', class: 'badge-info' };
    if (score >= 40) return { label: 'En Desarrollo', class: 'badge-warning' };
    return { label: 'Nivel Inicial', class: 'badge-danger' };
  },

  normalizeScore(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.min(100, Math.max(0, numericValue)) : 0;
  },

  getLessonUrl(weekNumber) {
    const normalizedWeek = Number(weekNumber);
    if (!Number.isInteger(normalizedWeek) || normalizedWeek < 1 || normalizedWeek > 16) {
      return '../aula/index.html';
    }
    return `../aula/semana${normalizedWeek}.html`;
  },

  getWeakCompetencies(scores = {}) {
    return Object.entries(this.competencies)
      .map(([key, comp]) => {
        const score = this.normalizeScore(scores[key]);
        return { key, score, ...comp };
      })
      .filter(item => item.score < 70)
      .sort((a, b) => a.score - b.score || a.recommendedWeek - b.recommendedWeek);
  },

  buildCompetencyRow(key, comp, score) {
    const status = this.getCompetencyStatus(score);

    return `
      <div style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; gap: 1rem; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 220px;">
            <strong style="color: var(--primary); font-size: 0.95rem;">${comp.name}</strong>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${comp.description}</div>
          </div>
          <div style="text-align: right; min-width: 120px;">
            <span class="badge ${status.class}" style="margin-bottom: 0.2rem; display: inline-block;">${status.label}</span>
            <div style="font-weight: 800; color: var(--primary); font-size: 0.9rem;">${score} / 100 pts</div>
          </div>
        </div>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${score}%;"></div>
        </div>
      </div>
    `;
  },

  buildStudyPlanHTML(weakCompetencies) {
    if (!weakCompetencies.length) {
      return `
        <div class="alert-box alert-success">
          <div>🎉</div>
          <div>
            <strong>¡Excelente nivel de preparación!</strong> Has alcanzado o superado los 70 pts requeridos en todas las áreas. Estás listo para rendir el simulacro oficial de 180 minutos.
          </div>
        </div>
      `;
    }

    let planHTML = `
      <p style="font-size: 0.9rem; color: var(--text-dark); margin-bottom: 1rem;">
        Basado en tus métricas actuales, se recomienda realizar los siguientes refuerzos específicos:
      </p>
      <div class="grid-2" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
    `;

    weakCompetencies.forEach(comp => {
      const lessonUrl = this.getLessonUrl(comp.recommendedWeek);
      planHTML += `
        <div style="background: var(--bg-light); border: 1px solid var(--border); border-left: 4px solid var(--warning); padding: 1rem; border-radius: 8px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--warning); text-transform: uppercase;">Refuerzo Prioritario</div>
          <h4 style="font-size: 0.95rem; color: var(--primary); margin: 0.2rem 0;">${comp.name}</h4>
          <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            Puntaje actual: <strong>${comp.score} pts</strong> (Meta: 70+ pts)
          </p>
          <a href="${lessonUrl}" class="btn btn-outline" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
            Ir a Semana ${comp.recommendedWeek} ➔
          </a>
        </div>
      `;
    });

    planHTML += '</div>';
    return planHTML;
  },

  renderDiagnosticPage() {
    const container = document.getElementById('competencies-list');
    const indexValDisplay = document.getElementById('cswa-index-val');
    const levelBadgeDisplay = document.getElementById('cswa-level-badge');
    const studyPlanContainer = document.getElementById('cswa-study-plan');

    if (!container || !window.AppState) return;

    const state = window.AppState.getUserProgress();
    const cswaIndex = window.AppState.calculateCSWAIndex();
    const scores = this.isValidScoresObject(state.cswaScores) ? state.cswaScores : {};

    if (indexValDisplay) indexValDisplay.textContent = `${cswaIndex}%`;
    if (levelBadgeDisplay) {
      const globalStatus = this.getCompetencyStatus(cswaIndex);
      levelBadgeDisplay.className = `badge ${globalStatus.class}`;
      levelBadgeDisplay.textContent = globalStatus.label;
    }

    let competencyHTML = '';
    const weakCompetencies = this.getWeakCompetencies(scores);

    for (const [key, comp] of Object.entries(this.competencies)) {
      const score = Math.round(this.normalizeScore(scores[key]));
      competencyHTML += this.buildCompetencyRow(key, comp, score);
    }

    container.innerHTML = competencyHTML;

    if (studyPlanContainer) {
      studyPlanContainer.innerHTML = this.buildStudyPlanHTML(weakCompetencies);
    }
  },

  isValidScoresObject(value) {
    return this.isObject(value) && Object.keys(value).length > 0;
  },

  isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CSWAEngine.renderDiagnosticPage();
});

window.CSWAEngine = CSWAEngine;
