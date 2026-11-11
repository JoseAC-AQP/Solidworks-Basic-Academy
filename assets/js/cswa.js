/**
 * SOLIDWORKS ACADEMY - CSWA Diagnostic & Evaluation Engine
 * Handles CSWA index calculations, 9-competency score breakdowns,
 * diagnostic renders, and personalized study plan generation.
 * Updated 2026.
 */

const CSWAEngine = {
  // Definition of the 9 official CSWA competency areas
  competencies: {
    croquis: {
      name: "Croquizado 2D y Restricciones",
      description: "Dominio de entidades 2D, cotas inteligentes y relaciones geométricas explícitas.",
      recommendedWeek: 3
    },
    piezas: {
      name: "Modelado de Piezas 3D",
      description: "Construcción de volúmenes mediante extrusión y revolución saliente/corte.",
      recommendedWeek: 5
    },
    modificacion: {
      name: "Modificación Dimensional Paramétrica",
      description: "Gestión de variables globales (=A, =B, =C) y tablas de ecuaciones sin perder la intención del diseño.",
      recommendedWeek: 8
    },
    interpretacion: {
      name: "Interpretación de Planos 2D",
      description: "Lectura de vistas ortogonales, cortes y detalles para reconstrucción 3D.",
      recommendedWeek: 8
    },
    operaciones: {
      name: "Operaciones Avanzadas y Matrices",
      description: "Uso eficiente de redondeos, chaflanes, vaciados y matrices lineales/circulares.",
      recommendedWeek: 6
    },
    propiedades_fisicas: {
      name: "Propiedades Físicas y Masa",
      description: "Asignación de materiales normados, medición de densidad, masa (g) y Centro de Gravedad.",
      recommendedWeek: 11
    },
    ensamblajes: {
      name: "Ensamblajes y Componente Fijo",
      description: "Montaje de componentes (.SLDASM), control del origen (f) y grados de libertad.",
      recommendedWeek: 9
    },
    relaciones_posicion: {
      name: "Relaciones de Posición y Coordenadas",
      description: "Aplicación de mates estándar/avanzados y creación de Sistemas de Coordenadas personalizados.",
      recommendedWeek: 10
    },
    tiempo_limite: {
      name: "Rendimiento y Tiempo Límite",
      description: "Velocidad de ejecución y resolución de problemas bajo la restricción de 180 minutos.",
      recommendedWeek: 15
    }
  },

  // Calculate percentage and status badge for a single competency score
  getCompetencyStatus(score) {
    if (score >= 85) return { label: 'Dominio Demostrado', class: 'badge-success' };
    if (score >= 70) return { label: 'Competente (CSWA Ready)', class: 'badge-info' };
    if (score >= 40) return { label: 'En Desarrollo', class: 'badge-warning' };
    return { label: 'Nivel Inicial', class: 'badge-danger' };
  },

  // Render main competencies list on cswa/diagnostico.html
  renderDiagnosticPage() {
    const container = document.getElementById('competencies-list');
    const indexValDisplay = document.getElementById('cswa-index-val');
    const levelBadgeDisplay = document.getElementById('cswa-level-badge');
    const studyPlanContainer = document.getElementById('cswa-study-plan');

    if (!container) return;

    const state = AppState.getUserProgress();
    const cswaIndex = AppState.calculateCSWAIndex();
    const scores = state.cswaScores || {};

    // 1. Update Index Header
    if (indexValDisplay) indexValDisplay.textContent = `${cswaIndex}%`;
    if (levelBadgeDisplay) {
      const globalStatus = this.getCompetencyStatus(cswaIndex);
      levelBadgeDisplay.className = `badge ${globalStatus.class}`;
      levelBadgeDisplay.textContent = globalStatus.label;
    }

    // 2. Render 9 Competency Bars
    let html = '';
    const weakCompetencies = [];

    for (const [key, comp] of Object.entries(this.competencies)) {
      const score = Math.round(scores[key] || 0);
      const status = this.getCompetencyStatus(score);

      if (score < 70) {
        weakCompetencies.push({ key, score, ...comp });
      }

      html += `
        <div style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <div>
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
    }

    container.innerHTML = html;

    // 3. Render Personalized Study Plan
    if (studyPlanContainer) {
      if (weakCompetencies.length === 0) {
        studyPlanContainer.innerHTML = `
          <div class="alert-box alert-success">
            <div>🎉</div>
            <div>
              <strong>¡Excelente nivel de preparación!</strong> Has alcanzado o superado los 70 pts requeridos en todas las áreas. Estás listo para rendir el simulacro oficial de 180 minutos.
            </div>
          </div>
        `;
      } else {
        let planHTML = `
          <p style="font-size: 0.9rem; color: var(--text-dark); margin-bottom: 1rem;">
            Basado en tus métricas actuales, se recomienda realizar los siguientes refuerzos específicos:
          </p>
          <div class="grid-2" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
        `;

        weakCompetencies.forEach(comp => {
          planHTML += `
            <div style="background: var(--bg-light); border: 1px solid var(--border); border-left: 4px solid var(--warning); padding: 1rem; border-radius: 8px;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--warning); uppercase;">Refuerzo Prioritario</div>
              <h4 style="font-size: 0.95rem; color: var(--primary); margin: 0.2rem 0;">${comp.name}</h4>
              <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 0.75rem;">Puntaje actual: <strong>${comp.score} pts</strong> (Meta: 70+ pts)</p>
              <a href="../aula/semana${comp.recommendedWeek}.html" class="btn btn-outline" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                Ir a Semana ${comp.recommendedWeek} ➔
              </a>
            </div>
          `;
        });

        planHTML += `</div>`;
        studyPlanContainer.innerHTML = planHTML;
      }
    }
  }
};

// Automatic execution on diagnostic page load
document.addEventListener('DOMContentLoaded', () => {
  CSWAEngine.renderDiagnosticPage();
});

// Global export
window.CSWAEngine = CSWAEngine;
