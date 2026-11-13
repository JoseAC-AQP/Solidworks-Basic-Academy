/**
 * SOLIDWORKS ACADEMY - Universal Quiz & Evaluation Engine
 * Handles reading checks, practical exam evaluations, score tracking,
 * automated feedback UI, and state synchronization with AppState and LocalStorage.
 * Updated 2026.
 */

const QuizEngine = {
  defaultMessages: {
    unanswered: 'Por favor, responde a todas las preguntas antes de enviar la evaluación.',
    invalidNumeric: 'Por favor, ingrese un valor numérico válido.',
    success: '<strong>¡Excelente!</strong> Has respondido correctamente las preguntas de comprobación.',
    error: '<strong>Revisa tus respuestas:</strong> Hay inconsistencias en una o más preguntas. Repasa el material e intentalo nuevamente.'
  },

  getAppState() {
    if (typeof window === 'undefined') return null;
    return window.AppState || null;
  },

  normalizeValue(value) {
    if (Array.isArray(value)) {
      return value
        .filter(item => item !== null && item !== undefined && item !== '')
        .map(item => item.toString().trim());
    }

    if (value === null || value === undefined) return '';
    return value.toString().trim();
  },

  getFormValue(form, fieldName) {
    if (!form || !fieldName) return undefined;

    const matchingFields = Array.from(form.elements).filter((element) => element.name === fieldName);
    if (!matchingFields.length) return undefined;

    const isChoiceField = matchingFields.some((element) => element.type === 'radio' || element.type === 'checkbox');
    if (isChoiceField) {
      const selected = matchingFields.filter((element) => element.checked).map((element) => element.value);
      return selected.length ? selected : null;
    }

    const firstField = matchingFields[0];
    return firstField.value;
  },

  valuesMatch(actualValue, expectedValue) {
    const normalizedActual = this.normalizeValue(actualValue);
    const normalizedExpected = this.normalizeValue(expectedValue);

    if (Array.isArray(normalizedExpected)) {
      const actualValues = Array.isArray(normalizedActual) ? normalizedActual : [normalizedActual];
      return normalizedExpected.length === actualValues.length &&
        normalizedExpected.every((value) => actualValues.includes(value));
    }

    if (Array.isArray(normalizedActual)) {
      return normalizedActual.includes(normalizedExpected);
    }

    return normalizedActual === normalizedExpected;
  },

  setFeedback(feedbackEl, variant, htmlContent) {
    if (!feedbackEl) return;
    feedbackEl.style.display = 'block';
    feedbackEl.className = `alert-box alert-${variant} fade-in`;
    feedbackEl.innerHTML = htmlContent;
  },

  setFeedbackText(feedbackEl, variant, title, detailText) {
    if (!feedbackEl) return;

    feedbackEl.style.display = 'block';
    feedbackEl.className = `alert-box alert-${variant} fade-in`;
    feedbackEl.innerHTML = '';

    const strong = document.createElement('strong');
    strong.textContent = title;
    feedbackEl.appendChild(strong);

    const textNode = document.createTextNode(` ${detailText}`);
    feedbackEl.appendChild(textNode);
  },

  /**
   * Evaluates a standard form-based quiz or practical exam.
   * @param {Object} options - Configuration for the evaluation.
   * @param {string} options.formId - ID of the HTML form element containing inputs.
   * @param {string} options.feedbackId - ID of the container element to display feedback.
   * @param {string} options.quizId - Key name used in AppState.
   * @param {number} options.weekNumber - Week number associated with the quiz.
   * @param {Object} options.answers - Key-value pair of correct answers.
   * @param {Object} options.competencyGains - Object mapping CSWA competencies to points earned on success.
   * @param {number} [options.passingThreshold] - Percentage needed to pass (defaults to 100 for compatibility).
   * @param {boolean} [options.savePartialResults] - Whether partial results should be stored even on failure.
   * @param {boolean} [options.recordOnlyOnPass] - Legacy alias for compatibility.
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
    passingThreshold = 100,
    savePartialResults = false,
    recordOnlyOnPass = true,
    successMsg = this.defaultMessages.success,
    errorMsg = this.defaultMessages.error
  }) {
    const form = document.getElementById(formId);
    const feedbackEl = document.getElementById(feedbackId);
    const appState = this.getAppState();

    if (!form) {
      console.error(`QuizEngine Error: Form with ID '${formId}' not found.`);
      return false;
    }

    if (!answers || Object.keys(answers).length === 0) {
      console.warn('QuizEngine Error: No answer map was provided.');
      return false;
    }

    const formData = new FormData(form);
    let totalQuestions = Object.keys(answers).length;
    let correctCount = 0;
    let unanswered = false;

    for (const [qKey, expectedValue] of Object.entries(answers)) {
      const userValue = this.getFormValue(form, qKey);
      const normalizedUserValue = this.normalizeValue(userValue);
      const normalizedExpectedValue = this.normalizeValue(expectedValue);

      if (!normalizedUserValue || (Array.isArray(normalizedUserValue) && normalizedUserValue.length === 0)) {
        unanswered = true;
        break;
      }

      if (this.valuesMatch(normalizedUserValue, normalizedExpectedValue)) {
        correctCount++;
      }
    }

    if (unanswered) {
      alert(this.defaultMessages.unanswered);
      return false;
    }

    const isPassed = passingThreshold <= 0 || correctCount === totalQuestions;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const shouldRecordResult = (() => {
      if (!appState || typeof appState.recordQuizResult !== 'function') return false;
      if (recordOnlyOnPass) return isPassed;
      return isPassed || savePartialResults;
    })();

    if (feedbackEl) {
      feedbackEl.style.display = 'block';
      if (isPassed) {
        this.setFeedback(feedbackEl, 'success', `${successMsg} (${correctCount}/${totalQuestions} correctas - 100%)`);
      } else {
        this.setFeedback(feedbackEl, 'danger', `${errorMsg} (${correctCount}/${totalQuestions} correctas - ${scorePercentage}%)`);
      }
    }

    if (shouldRecordResult) {
      appState.recordQuizResult(quizId, scorePercentage, competencyGains);
      if (isPassed && weekNumber) {
        appState.markWeekCompleted?.(weekNumber);
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
   * @param {Object} [options] - Additional evaluation config.
   */
  evaluateNumericAnswer(inputId, expectedVal, tolerance, feedbackId, quizKey, competencyGains = {}, options = {}) {
    const input = document.getElementById(inputId);
    const feedbackEl = document.getElementById(feedbackId);
    const appState = this.getAppState();
    const { recordOnlyOnPass = true, savePartialResults = false } = options;

    if (!input) return false;

    const rawValue = input.value;
    const userVal = Number.parseFloat(rawValue);

    if (!Number.isFinite(userVal)) {
      alert(this.defaultMessages.invalidNumeric);
      return false;
    }

    const minVal = expectedVal - tolerance;
    const maxVal = expectedVal + tolerance;
    const isCorrect = userVal >= minVal && userVal <= maxVal;

    if (feedbackEl) {
      if (isCorrect) {
        const detailText = `El resultado ingresado (${userVal}) está dentro del rango nominal aceptado [${minVal.toFixed(2)} - ${maxVal.toFixed(2)}].`;
        this.setFeedbackText(feedbackEl, 'success', '¡Valor Correcto!', detailText);
      } else {
        const detailText = `Tu resultado (${userVal}) difiere del valor esperado. Revisa el material asignado y la geometría 3D.`;
        this.setFeedbackText(feedbackEl, 'danger', 'Valor Fuera de Tolerancia.', detailText);
      }
    }

    const shouldRecordResult = (() => {
      if (!appState || typeof appState.recordQuizResult !== 'function') return false;
      if (recordOnlyOnPass) return isCorrect;
      return isCorrect || savePartialResults;
    })();

    if (shouldRecordResult) {
      appState.recordQuizResult(quizKey, isCorrect ? 100 : 0, competencyGains);
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
      btn.disabled = true;
      btn.style.opacity = '0.85';
    }
  }
};

// Global Export
window.QuizEngine = QuizEngine;
