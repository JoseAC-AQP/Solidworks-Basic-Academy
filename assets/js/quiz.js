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
    return typeof window === 'undefined' ? null : window.AppState || null;
  },

  normalizeValue(value) {
    if (Array.isArray(value)) return value.filter(item => item !== null && item !== undefined && item !== '').map(item => item.toString().trim());
    return value === null || value === undefined ? '' : value.toString().trim();
  },

  getFormValue(form, fieldName) {
    if (!form || !fieldName) return undefined;
    const fields = Array.from(form.elements).filter(element => element.name === fieldName);
    if (!fields.length) return undefined;
    if (fields.some(element => element.type === 'radio' || element.type === 'checkbox')) {
      const selected = fields.filter(element => element.checked).map(element => element.value);
      return selected.length ? selected : null;
    }
    const field = fields[0];
    if (field.tagName === 'SELECT' && field.multiple) return Array.from(field.selectedOptions).map(option => option.value);
    return field.value;
  },

  valuesMatch(actualValue, expectedValue) {
    const actual = this.normalizeValue(actualValue);
    const expected = this.normalizeValue(expectedValue);
    if (Array.isArray(expected)) {
      const actualArray = Array.isArray(actual) ? actual : [actual];
      return actualArray.length === expected.length && expected.every(value => actualArray.includes(value));
    }
    return Array.isArray(actual) ? actual.includes(expected) : actual === expected;
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
    feedbackEl.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = title;
    feedbackEl.append(strong, document.createTextNode(` ${detailText}`));
  },

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
    if (!Number.isFinite(Number(passingThreshold)) || passingThreshold < 0 || passingThreshold > 100) {
      console.warn('QuizEngine Error: passingThreshold must be between 0 and 100.');
      return false;
    }

    const entries = Object.entries(answers);
    let correctCount = 0;
    for (const [questionName, expected] of entries) {
      const answer = this.getFormValue(form, questionName);
      const normalized = this.normalizeValue(answer);
      if (normalized === '' || (Array.isArray(normalized) && normalized.length === 0)) {
        window.alert(this.defaultMessages.unanswered);
        return false;
      }
      if (this.valuesMatch(answer, expected)) correctCount += 1;
    }

    const totalQuestions = entries.length;
    const scorePercentage = Math.round(correctCount / totalQuestions * 100);
    const isPassed = scorePercentage >= Number(passingThreshold);
    if (feedbackEl) {
      const scoreText = ` (${correctCount}/${totalQuestions} correctas - ${scorePercentage}%)`;
      this.setFeedback(feedbackEl, isPassed ? 'success' : 'danger', `${isPassed ? successMsg : errorMsg}${scoreText}`);
    }

    const shouldRecord = appState && typeof appState.recordQuizResult === 'function' &&
      (recordOnlyOnPass ? isPassed : isPassed || savePartialResults);
    if (shouldRecord) {
      // Mark completion first so the saved index includes the course-completion bonus.
      if (isPassed && Number.isInteger(Number(weekNumber)) && Number(weekNumber) > 0 && typeof appState.markWeekCompleted === 'function') {
        appState.markWeekCompleted(Number(weekNumber));
      }
      appState.recordQuizResult(quizId, scorePercentage, isPassed ? competencyGains : {});
      if (isPassed && weekNumber) this.updateWeekStatusUI(Number(weekNumber));
    }
    return isPassed;
  },

  evaluateNumericAnswer(inputId, expectedVal, tolerance, feedbackId, quizKey, competencyGains = {}, options = {}) {
    const input = document.getElementById(inputId);
    const feedbackEl = document.getElementById(feedbackId);
    const appState = this.getAppState();
    const { recordOnlyOnPass = true, savePartialResults = false } = options;
    if (!input) return false;

    const userVal = Number.parseFloat(input.value);
    const expected = Number(expectedVal);
    const allowedTolerance = Number(tolerance);
    if (!Number.isFinite(userVal) || !Number.isFinite(expected) || !Number.isFinite(allowedTolerance) || allowedTolerance < 0) {
      window.alert(this.defaultMessages.invalidNumeric);
      return false;
    }

    const minVal = expected - allowedTolerance;
    const maxVal = expected + allowedTolerance;
    const isCorrect = userVal >= minVal && userVal <= maxVal;
    if (feedbackEl) {
      const message = isCorrect
        ? `El resultado ingresado (${userVal}) está dentro del rango nominal aceptado [${minVal.toFixed(2)} - ${maxVal.toFixed(2)}].`
        : `Tu resultado (${userVal}) difiere del valor esperado. Revisa el material asignado y la geometría 3D.`;
      this.setFeedbackText(feedbackEl, isCorrect ? 'success' : 'danger', isCorrect ? '¡Valor Correcto!' : 'Valor Fuera de Tolerancia.', message);
    }

    const shouldRecord = appState && typeof appState.recordQuizResult === 'function' &&
      (recordOnlyOnPass ? isCorrect : isCorrect || savePartialResults);
    if (shouldRecord) appState.recordQuizResult(quizKey, isCorrect ? 100 : 0, isCorrect ? competencyGains : {});
    return isCorrect;
  },

  updateWeekStatusUI(weekNumber) {
    const progressBar = document.getElementById('week-progress-bar');
    const progressTrack = document.getElementById('week-progress-track');
    const badge = document.getElementById('week-status-badge');
    const button = document.getElementById('mark-completed-btn');
    if (progressBar) progressBar.style.width = '100%';
    if (progressTrack) progressTrack.setAttribute('aria-valuenow', '100');
    if (badge) {
      badge.className = 'badge badge-success';
      badge.textContent = 'Completado';
    }
    if (button) {
      button.textContent = `✓ Semana ${weekNumber} Completada`;
      button.disabled = true;
      button.style.opacity = '0.85';
    }
  }
};

window.QuizEngine = QuizEngine;
