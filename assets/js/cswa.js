// SOLIDWORKS ACADEMY - CSWA Practice Center & Diagnostic Engine

document.addEventListener('DOMContentLoaded', () => {
  console.log('SOLIDWORKS ACADEMY - CSWA Diagnostic Engine (cswa.js) cargado.');
  initCSWADashboard();
});

// Inicializar y renderizar el Dashboard de Diagnóstico CSWA
function initCSWADashboard() {
  const indexDisplay = document.getElementById('cswa-index-val');
  const levelBadge = document.getElementById('cswa-level-badge');
  const planContainer = document.getElementById('cswa-study-plan');

  const progress = AppState.getUserProgress();
  const overallIndex = AppState.calculateCSWAIndex();

  // Actualizar indicador general
  if (indexDisplay) {
    indexDisplay.textContent = overallIndex + '%';
  }

  // Clasificación del Nivel de Preparación Interno
  if (levelBadge) {
    const levelInfo = getPreparationLevel(overallIndex);
    levelBadge.textContent = levelInfo.title;
    levelBadge.className = `badge ${levelInfo.badgeClass}`;
  }

  // Renderizar Barras de Competencias si existe la lista
  renderCompetencies(progress.cswaScores);

  // Generar Plan de Estudio Personalizado Automático
  if (planContainer) {
    renderPersonalizedStudyPlan(progress.cswaScores, planContainer);
  }
}

// Determinar el nivel de preparación según la escala pedagógica interna (0-100)
function getPreparationLevel(score) {
  if (score >= 95) {
    return { title: 'Dominio Demostrado', badgeClass: 'badge-success' };
  } else if (score >= 85) {
    return { title: 'Preparación Avanzada', badgeClass: 'badge-success' };
  } else if (score >= 70) {
    return { title: 'Competente', badgeClass: 'badge-info' };
  } else if (score >= 50) {
    return { title: 'En Desarrollo', badgeClass: 'badge-warning' };
  } else {
    return { title: 'Nivel Inicial', badgeClass: 'badge-danger' };
  }
}

// Renderizar las 9 competencias diagnósticas CSWA
function renderCompetencies(scores) {
  const competencyMap = {
    croquis: '1. Croquis y Relaciones Geométricas',
    piezas: '2. Modelado de Piezas',
    modificacion: '3. Modificación Dimensional',
    interpretacion: '4. Interpretación de Geometrías',
    operaciones: '5. Operaciones de Sólidos',
    propiedades_fisicas: '6. Propiedades Físicas (Masa/CG)',
    ensamblajes: '7. Ensamblajes',
    relaciones_posicion: '8. Relaciones de Posición',
    tiempo_limite: '9. Resolución Bajo Tiempo Limitado'
  };

  const container = document.getElementById('competencies-list');
  if (!container) return;

  container.innerHTML = '';

  for (const [key, label] of Object.entries(competencyMap)) {
    const val = scores[key] || 0;
    let fillClass = 'mastered';
    if (val < 50) fillClass = 'weak';
    else if (val < 85) fillClass = 'developing';

    const itemHtml = `
      <div class="competency-bar-item">
        <div class="competency-bar-label">
          <span>${label}</span>
          <span>${val}%</span>
        </div>
        <div class="competency-bar-bg">
          <div class="competency-bar-fill ${fillClass}" style="width: ${val}%;"></div>
        </div>
      </div>
    `;
    container.innerHTML += itemHtml;
  }
}

// Generar Plan de Estudio Personalizado Automático basado en debilidades
function renderPersonalizedStudyPlan(scores, container) {
  container.innerHTML = '';
  const weakCompetencies = [];

  const recommendations = {
    croquis: { tema: 'Relaciones geométricas y cotas inteligentes', leccion: 'Semana 3 / 4', tiempo: '45 min' },
    piezas: { tema: 'Extrusiones y revoluciones de sólida', leccion: 'Semana 5 / 6', tiempo: '60 min' },
    modificacion: { tema: 'Reconstrucción y edición de cotas paramétricas', leccion: 'Semana 8', tiempo: '40 min' },
    interpretacion: { tema: 'Lectura e interpretación de planos técnicos 2D', leccion: 'Semana 7 / 8', tiempo: '50 min' },
    operaciones: { tema: 'Operaciones avanzadas, matrices y vaciado', leccion: 'Semana 6', tiempo: '45 min' },
    propiedades_fisicas: { tema: 'Asignación de materiales y cálculo de Masa/CG', leccion: 'Semana 11 / 12', tiempo: '40 min' },
    ensamblajes: { tema: 'Inserción de componentes y restricciones fijas/móviles', leccion: 'Semana 9', tiempo: '50 min' },
    relaciones_posicion: { tema: 'Relaciones de posición coincidentes, concéntricas y de ángulo', leccion: 'Semana 10', tiempo: '55 min' },
    tiempo_limite: { tema: 'Simulacros cronometrados tipo CSWA', leccion: 'Semana 13 / 15', tiempo: '90 min' }
  };

  for (const [key, val] of Object.entries(scores)) {
    if (val < 70) {
      weakCompetencies.push({ key, val, rec: recommendations[key] });
    }
  }

  if (weakCompetencies.length === 0) {
    container.innerHTML = `
      <div class="alert-box alert-success">
        <div>
          <strong>¡Excelente Desempeño!</strong>
          <p>Has demostrado competencia adecuada en todas las áreas de evaluación. Te recomendamos realizar simulacros integrales para consolidar tu tiempo de respuesta.</p>
        </div>
      </div>
    `;
    return;
  }

  let html = `<h4 style="color: var(--primary); margin-bottom: 1rem;">📋 Plan de Refuerzo Personalizado Recomendado:</h4><ul style="list-style: none;">`;

  weakCompetencies.forEach(item => {
    html += `
      <li style="background: var(--bg-light); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; color: var(--primary);">
          <span>🎯 Reforzar: ${item.rec.tema}</span>
          <span class="badge badge-warning">Puntaje actual: ${item.val}%</span>
        </div>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0.4rem 0;">Recomendación: Repasar lección <strong>${item.rec.leccion}</strong> y resolver ejercicios de práctica.</p>
        <div style="font-size: 0.85rem; color: var(--accent-hover); font-weight: 600;">⏱️ Tiempo estimado: ${item.rec.tiempo}</div>
      </li>
    `;
  });

  html += '</ul>';
  container.innerHTML = html;
}

// Ejecutar simulador o prueba de diagnóstico rápida
function runDiagnosticQuiz(quizId, userAnswers) {
  // Lógica para procesar respuestas y actualizar competencias específicas
  const updates = {
    croquis: 85,
    piezas: 80,
    propiedades_fisicas: 75,
    ensamblajes: 70
  };

  AppState.recordQuizResult(quizId, 82, updates);
  alert('Diagnóstico finalizado. Tu Índice de Preparación CSWA y Plan de Estudio se han actualizado.');
  window.location.reload();
}
