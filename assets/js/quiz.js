/**
 * SOLIDWORKS ACADEMY - Universal Quiz & Evaluation Engine
 * Handles reading checks, practical exam evaluations, score tracking,
 * automated feedback UI, and state synchronization with AppState and LocalStorage.
 * Updated 2026.
 */

const QuizEngine = {
  /**
   * Evaluates a standard form-based quiz or practical exam.
   * @param {Object} options - Configuration for the evaluation.
   * @param {string} options.formId - ID of the HTML form element containing inputs.
   * @param {string} options.feedbackId - ID of the container element to display feedback.
   * @param {string} options.quizId - Key name used in AppState (e.g. 'semana1_quiz', 'semana4_eval1').
   * @param {number} options.weekNumber - Week number associated with the quiz (1-16).
   * @param {Object} options.answers - Key-value pair of correct answers (e.g. { q1: 'B', q2: 'A' }).
   * @param {Object} options.competencyGains - Object mapping CSWA competencies to points earned on success.
   * @param {string} [options.successMsg] - Custom success message.
   * @param {string} [options.errorMsg] - Custom error message on wrong answer.
   */
  evaluateQuiz({
    formId,
    feedbackId,
    quizId,
    weekNumber,
    answers,
    competencyGains = {},
    successMsg = "<strong>¡Excelente!</strong> Has respondido correctamente las preguntas de comprobación.",
    errorMsg = "<strong>Revisa tus respuestas:</strong> Hay inconsistencias en una o más preguntas. Repasa el material e intentalo nuevamente."
  }) {
    const form = document.getElementById(formId);
    const feedbackEl = document.getElementById(feedbackId);

    if (!form) {
      console.error(`QuizEngine Error: Form with ID '${formId}' not found.`);
      return false;
    }

    const formData = new FormData(form);
    let totalQuestions = Object.keys(answers).length;
    let correctCount = 0;
    let unanswered = false;

    // Check each question answer
    for (const [qKey, expectedValue] of Object.entries(answers)) {
      const userValue = formData.get(qKey);
      if (!userValue) {
        unanswered = true;
        break;
      }
      if (userValue.toString().trim() === expectedValue.toString().trim()) {
        correctCount++;
      }
    }

    if (unanswered) {
      alert("Por favor, responde a todas las preguntas antes de enviar la evaluación.");
      return false;
    }

    const isPassed = correctCount === totalQuestions;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    // Render feedback if container element exists
    if (feedbackEl) {
      feedbackEl.style.display = 'block';
      if (isPassed) {
        feedbackEl.className = 'alert-box alert-success fade-in';
        feedbackEl.innerHTML = `${successMsg} (${correctCount}/${totalQuestions} correctas - 100%)`;
      } else {
        feedbackEl.className = 'alert-box alert-danger fade-in';
        feedbackEl.innerHTML = `${errorMsg} (${correctCount}/${totalQuestions} correctas - ${scorePercentage}%)`;
      }
    }

    // Record results and mark week completed if passed
    if (isPassed && typeof AppState !== 'undefined') {
      AppState.recordQuizResult(quizId, 100, competencyGains);
      if (weekNumber) {
        AppState.markWeekCompleted(weekNumber);
        this.updateWeekStatusUI(weekNumber);
      }
    }

    return isPassed;
  },

  /**
   * Evaluates numerical mass or coordinate input fields (e.g. CSWA Simulator numeric entries).
   * @param {string} inputId - ID of the text/number input element.
   * @param {number} expectedVal - Target numeric answer.
   * @param {number} tolerance - Allowed +/- deviation margin.
   * @param {string} feedbackId - ID of feedback container.
   * @param {string} quizKey - AppState identifier.
   * @param {Object} competencyGains - CSWA competency points gained upon passing.
   */
  evaluateNumericAnswer(inputId, expectedVal, tolerance, feedbackId, quizKey, competencyGains = {}) {
    const input = document.getElementById(inputId);
    const feedbackEl = document.getElementById(feedbackId);

    if (!input) return false;

    const userVal = parseFloat(input.value);
    if (isNaN(userVal)) {
      alert("Por favor, ingrese un valor numérico válido.");
      return false;
    }

    const minVal = expectedVal - tolerance;
    const maxVal = expectedVal + tolerance;
    const isCorrect = userVal >= minVal && userVal <= maxVal;

    if (feedbackEl) {
      feedbackEl.style.display = 'block';
      if (isCorrect) {
        feedbackEl.className = 'alert-box alert-success fade-in';
        feedbackEl.innerHTML = `<strong>¡Valor Correcto!</strong> El resultado ingresado (${userVal}) está dentro del rango nominal aceptado [${minVal.toFixed(2)} - ${maxVal.toFixed(2)}].`;
      } else {
        feedbackEl.className = 'alert-box alert-danger fade-in';
        feedbackEl.innerHTML = `<strong>Valor Fuera de Tolerancia.</strong> Tu resultado (${userVal}) difiere del valor esperado. Revisa el material asignado y la geometría 3D.`;
      }
    }

    if (isCorrect && typeof AppState !== 'undefined') {
      AppState.recordQuizResult(quizKey, 100, competencyGains);
    }

    return isCorrect;
  },

  /**
   * Updates visual indicators for completed weeks (progress bars, badges, buttons).
   * @param {number} weekNumber - Associated week number.
   */
  updateWeekStatusUI(weekNumber) {
    const progressBar = document.getElementById('week-progress-bar');
    const badge = document.getElementById('week-status-badge');
    const btn = document.getElementById('mark-completed-btn');

    if (progressBar) progressBar.style.width = '100%';
    if (badge) {
      badge.className = 'badge badge-success';
      badge.textContent = 'Completado';
    }
    if (btn) {
      btn.textContent = `✓ Semana ${weekNumber} Completada`;
      btn.style.opacity = '0.85';
    }
  }
};

// Global Export
window.QuizEngine = QuizEngine;
